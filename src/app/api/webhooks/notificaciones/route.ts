import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/env";
import { getCurrentEvent } from "@/lib/events/current";
import { dispatchDue } from "@/lib/push/dispatch";
import { logError } from "@/lib/errors";

// Varias decenas de envíos por minuto en el día del evento.
export const maxDuration = 60;

const digest = (s: string) => createHash("sha256").update(s).digest();

/**
 * Despachador de notificaciones push. Lo llama pg_cron (pg_net) cada minuto con
 * `Authorization: Bearer <CRON_SECRET>` (ver supabase/manual/2026-10-15-cron-notificaciones.sql).
 */
export async function POST(request: Request) {
  const secret = getCronSecret();
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || !timingSafeEqual(digest(auth), digest(`Bearer ${secret}`))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const event = await getCurrentEvent();
    if (!event) return NextResponse.json({ ok: true, skipped: "sin evento" });
    return NextResponse.json({ ok: true, ...(await dispatchDue(event)) });
  } catch (error) {
    logError("webhooks.notificaciones", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
