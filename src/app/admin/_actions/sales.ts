"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/staff";
import { getRpc } from "@/lib/db/server-rpc";
import { confirmManualPayment } from "@/lib/orders/manual-sale";
import { logError, userMessage, type ActionResult } from "@/lib/errors";

export async function confirmPaymentAction(orderId: string): Promise<ActionResult<null>> {
  try {
    const ctx = await requireStaff("sales.manual");
    const res = await confirmManualPayment(getRpc(), orderId, ctx.user.id);
    revalidatePath("/admin", "layout");
    return res.updated
      ? { ok: true, data: null, message: `Pago confirmado. ${res.tickets_validated} boleto(s) activado(s).` }
      : { ok: false, error: "El pedido ya no está pendiente de pago." };
  } catch (error) {
    logError("confirmPaymentAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

export async function voidTicketAction(ticketId: string, reason: string): Promise<ActionResult<null>> {
  try {
    const ctx = await requireStaff("tickets.void");
    if (!reason || reason.trim().length < 5) return { ok: false, error: "Indica el motivo (mínimo 5 caracteres)." };
    await getRpc().call("void_ticket", { p_ticket_id: ticketId, p_actor_id: ctx.user.id, p_reason: reason.trim() });
    revalidatePath("/admin", "layout");
    return { ok: true, data: null, message: "Boleto anulado y reservas liberadas." };
  } catch (error) {
    logError("voidTicketAction", error);
    return { ok: false, error: userMessage(error) };
  }
}
