"use server";

import { requireStaff } from "@/lib/auth/staff";
import { getRpc } from "@/lib/db/server-rpc";
import { checkInTicket, type CheckInResponse } from "@/lib/checkin/service";
import { searchAttendees } from "@/lib/admin/attendees";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError, userMessage, type ActionResult } from "@/lib/errors";
import { checkInSchema, checkInSearchSchema } from "@/lib/validation/schemas";

/** Valida un boleto (QR o código). La decisión es 100% del servidor. */
export async function checkInAction(input: { input: string; accessArea: string; method: "scan" | "manual" }): Promise<ActionResult<CheckInResponse>> {
  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) return { ok: true, data: { result: "invalid" } };
  try {
    const ctx = await requireStaff("checkin.perform");
    await enforceRateLimit("checkin", 240, 60_000, ctx.user.id);
    const res = await checkInTicket(getRpc(), {
      eventId: ctx.event.id,
      staffId: ctx.user.id,
      raw: parsed.data.input,
      accessArea: parsed.data.accessArea,
      method: parsed.data.method,
    });
    return { ok: true, data: res };
  } catch (error) {
    logError("checkInAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

export type CheckInSearchResult = { code: string; name: string; type: string; status: string; email: string };

/** Búsqueda alternativa al escaneo: por correo, nombre o código. */
export async function searchTicketsAction(query: string): Promise<ActionResult<CheckInSearchResult[]>> {
  const parsed = checkInSearchSchema.safeParse({ query });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Búsqueda inválida." };
  try {
    const ctx = await requireStaff("checkin.perform");
    await enforceRateLimit("checkin-search", 60, 60_000, ctx.user.id);
    const { rows } = await searchAttendees(ctx.event.id, { q: parsed.data.query, page: 1 });
    return {
      ok: true,
      data: rows.slice(0, 15).map((r) => ({
        code: r.public_code,
        name: r.attendee_name,
        type: r.ticket_types?.name ?? "",
        status: r.status,
        email: r.profiles?.email ?? r.attendee_email ?? r.order_items?.orders?.buyer_email ?? "",
      })),
    };
  } catch (error) {
    logError("searchTicketsAction", error);
    return { ok: false, error: userMessage(error) };
  }
}
