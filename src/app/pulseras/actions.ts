"use server";

import { requireStaff } from "@/lib/auth/staff";
import { searchAttendees } from "@/lib/admin/attendees";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError, userMessage, type ActionResult } from "@/lib/errors";
import { checkInSearchSchema } from "@/lib/validation/schemas";

export type WristbandSearchResult = {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  email: string;
  wristbandDeliveredAt: string | null;
};

/** Busca boletos por nombre, correo, folio (GL-…) o pedido (GLF-…) para entregar la pulsera. */
export async function searchWristbandsAction(query: string): Promise<ActionResult<WristbandSearchResult[]>> {
  const parsed = checkInSearchSchema.safeParse({ query });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Búsqueda inválida." };
  try {
    const ctx = await requireStaff("wristbands.manage");
    await enforceRateLimit("wristband-search", 60, 60_000, ctx.user.id);
    const { rows } = await searchAttendees(ctx.event.id, { q: parsed.data.query, page: 1 });
    return {
      ok: true,
      data: rows.slice(0, 15).map((r) => ({
        id: r.id,
        code: r.public_code,
        name: r.attendee_name || r.profiles?.full_name || "",
        type: r.ticket_types?.name ?? "",
        status: r.status,
        email: r.profiles?.email ?? r.attendee_email ?? r.order_items?.orders?.buyer_email ?? "",
        wristbandDeliveredAt: r.wristband_delivered_at,
      })),
    };
  } catch (error) {
    logError("searchWristbandsAction", error);
    return { ok: false, error: userMessage(error) };
  }
}
