import "server-only";
import webpush from "web-push";
import { getPushConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/errors";
import type { PushTarget } from "@/lib/push/queue";

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

let vapidReady = false;

export function isPushConfigured(): boolean {
  return getPushConfig() !== null;
}

function ensureVapid(): boolean {
  const config = getPushConfig();
  if (!config) return false;
  if (!vapidReady) {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    vapidReady = true;
  }
  return true;
}

/** Ejecuta `fn` sobre `ids` en bloques (los filtros `in` de PostgREST viajan en la URL). */
async function inChunks(ids: string[], fn: (chunk: string[]) => PromiseLike<unknown>, size = 200) {
  for (let i = 0; i < ids.length; i += size) await fn(ids.slice(i, i + size));
}

/**
 * Envía la notificación a cada suscripción con concurrencia limitada. Las
 * suscripciones que el servicio de push reporta como vencidas (404/410) se borran.
 */
export async function sendPush(targets: PushTarget[], payload: PushPayload, ttlSeconds = 6 * 60 * 60) {
  if (!targets.length) return { sent: 0, failed: 0 };
  if (!ensureVapid()) return { sent: 0, failed: targets.length };

  const body = JSON.stringify(payload);
  const queue = [...targets];
  const delivered: string[] = [];
  const expired: string[] = [];
  let failed = 0;

  const worker = async () => {
    for (let t = queue.shift(); t; t = queue.shift()) {
      try {
        await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, body, {
          TTL: ttlSeconds,
          urgency: "high",
        });
        delivered.push(t.id);
      } catch (error) {
        failed += 1;
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) expired.push(t.id);
        else logError("push.send", error);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(10, targets.length) }, worker));

  const admin = createAdminClient();
  await inChunks(expired, (chunk) => admin.from("push_subscriptions").delete().in("id", chunk));
  const now = new Date().toISOString();
  await inChunks(delivered, (chunk) => admin.from("push_subscriptions").update({ last_used_at: now }).in("id", chunk));
  return { sent: delivered.length, failed };
}

/** Suscripciones activas de un conjunto de perfiles. */
export async function targetsForProfiles(profileIds: string[]): Promise<PushTarget[]> {
  const admin = createAdminClient();
  const out: PushTarget[] = [];
  await inChunks([...new Set(profileIds)], async (chunk) => {
    const { data, error } = await admin.from("push_subscriptions").select("id, profile_id, endpoint, p256dh, auth").in("profile_id", chunk);
    if (error) logError("push.targets", error);
    out.push(...((data ?? []) as PushTarget[]));
  });
  return out;
}
