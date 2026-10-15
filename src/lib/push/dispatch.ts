import "server-only";
import { after } from "next/server";
import { getRpc } from "@/lib/db/server-rpc";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEvent } from "@/lib/events/current";
import { formatTime } from "@/lib/format";
import { logError } from "@/lib/errors";
import {
  claimDueNotifications,
  claimDueReminders,
  claimPromotedReservations,
  notificationRecipients,
  type DueReminder,
  type PromotedReservation,
} from "@/lib/push/queue";
import { isPushConfigured, sendPush, targetsForProfiles, type PushPayload } from "@/lib/push/send";
import type { EventRow, EventSettings } from "@/lib/types";

export const DEFAULT_REMINDER_MINUTES = 30;

export function reminderMinutes(settings: EventSettings | null | undefined): number {
  const v = settings?.reminder_minutes;
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : DEFAULT_REMINDER_MINUTES;
}

function reminderText(r: DueReminder, tz: string) {
  const where = r.location ? ` en ${r.location}` : "";
  return {
    title: r.kind === "activity" ? "Tu clase empieza pronto" : "Tu conferencia empieza pronto",
    body: `${r.name} empieza a las ${formatTime(r.starts_at, tz)}${where}. ¡Te esperamos!`,
    url: "/mi-cuenta/reservas",
    tag: `recordatorio-${r.reservation_id}`,
  };
}

export function promotionText(r: PromotedReservation, tz: string): PushPayload {
  return {
    title: "¡Se liberó un lugar!",
    body: `Ya tienes confirmada tu ${r.kind === "activity" ? "clase" : "conferencia"} ${r.name} a las ${formatTime(r.starts_at, tz)}.`,
    url: "/mi-cuenta/reservas",
    tag: `lugar-${r.reservation_id}`,
  };
}

/** Envía a cada reserva su notificación, en todos los dispositivos de la persona. */
async function sendToReservations<T extends { profile_id: string }>(
  rows: T[],
  payload: (r: T) => PushPayload,
  ttlSeconds: (r: T) => number,
) {
  if (!rows.length) return;
  const targets = await targetsForProfiles(rows.map((r) => r.profile_id));
  const byProfile = new Map<string, typeof targets>();
  for (const t of targets) byProfile.set(t.profile_id, [...(byProfile.get(t.profile_id) ?? []), t]);
  for (const r of rows) {
    const mine = byProfile.get(r.profile_id);
    if (mine?.length) await sendPush(mine, payload(r), ttlSeconds(r));
  }
}

/** Recordatorios de clases que empiezan dentro de la ventana configurada. */
async function sendReminders(event: EventRow) {
  const lead = reminderMinutes(event.settings);
  const due = await claimDueReminders(getRpc(), event.id, lead);
  await sendToReservations(due, (r) => reminderText(r, event.timezone), () => Math.max(lead, 5) * 60);
  return due.length;
}

/**
 * "¡Se liberó un lugar!" para reservas que pasaron de la lista de espera a
 * confirmadas. Con `reservationIds` solo se avisan esas (envío inmediato tras
 * liberar un lugar); sin ellos, todas las pendientes del evento. El aviso vale
 * hasta que empieza la sesión.
 */
export async function notifyPromotions(event: Pick<EventRow, "id" | "timezone">, reservationIds?: string[]) {
  if (!isPushConfigured() || (reservationIds && !reservationIds.length)) return 0;
  const promoted = await claimPromotedReservations(getRpc(), event.id, reservationIds);
  await sendToReservations(
    promoted,
    (r) => promotionText(r, event.timezone),
    (r) => Math.max(60, Math.floor((Date.parse(r.starts_at) - Date.now()) / 1000)),
  );
  return promoted.length;
}

/** Envía un aviso ya reclamado (estado `sending`) y guarda el resultado. */
export async function deliverNotification(n: { id: string; title: string; body: string; url: string | null }) {
  const admin = createAdminClient();
  try {
    const targets = await notificationRecipients(getRpc(), n.id);
    const res = await sendPush(targets, { title: n.title, body: n.body, url: n.url ?? "/mi-cuenta", tag: `aviso-${n.id}` });
    await admin
      .from("notifications")
      .update({ status: "sent", sent_count: res.sent, failed_count: res.failed, sent_at: new Date().toISOString() })
      .eq("id", n.id);
    return res;
  } catch (error) {
    logError("push.deliverNotification", error);
    await admin.from("notifications").update({ status: "failed" }).eq("id", n.id);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Trabajo del despachador (cada minuto vía pg_cron → /api/webhooks/notificaciones):
 * avisos de lugar liberado, recordatorios de clases y avisos programados que ya
 * deben salir. Sin llaves VAPID no se toca la cola, para no "gastar" avisos sin enviarlos.
 */
export async function dispatchDue(event: EventRow) {
  if (!isPushConfigured()) return { configured: false, promotions: 0, reminders: 0, notifications: 0 };
  let promotions = 0;
  try {
    promotions = await notifyPromotions(event);
  } catch (error) {
    logError("push.promotions", error);
  }
  let reminders = 0;
  try {
    reminders = await sendReminders(event);
  } catch (error) {
    logError("push.reminders", error);
  }
  const due = await claimDueNotifications(getRpc(), event.id);
  for (const n of due) await deliverNotification(n);
  return { configured: true, promotions, reminders, notifications: due.length };
}

/**
 * Aviso inmediato a las reservas que una acción acaba de promover. Corre después
 * de responder, para no demorar la acción; si no alcanza a reclamarlas, el
 * despachador de cada minuto las recoge. Sin `event` se usa el evento actual.
 */
export function notifyPromotionsAfterResponse(reservationIds: string[], event?: Pick<EventRow, "id" | "timezone">) {
  if (!reservationIds.length) return;
  after(async () => {
    try {
      const target = event ?? (await getCurrentEvent());
      if (target) await notifyPromotions(target, reservationIds);
    } catch (error) {
      logError("push.notifyPromotions", error);
    }
  });
}
