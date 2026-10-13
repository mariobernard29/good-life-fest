"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/staff";
import { getRpc } from "@/lib/db/server-rpc";
import { confirmManualPayment, createManualSale, type ManualSaleResult } from "@/lib/orders/manual-sale";
import { AppError, logError, userMessage, type ActionResult } from "@/lib/errors";
import { fieldErrors, manualSaleSchema, type ManualSaleInput } from "@/lib/validation/schemas";
import { hasPermission } from "@/lib/auth/permissions";

export async function manualSaleAction(input: ManualSaleInput): Promise<ActionResult<ManualSaleResult>> {
  const parsed = manualSaleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos del formulario.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const ctx = await requireStaff("sales.manual");
    if (parsed.data.mode === "complimentary" && !hasPermission(ctx.permissions, "sales.complimentary")) {
      throw new AppError("FORBIDDEN_COMPLIMENTARY");
    }
    const d = parsed.data;
    const result = await createManualSale(getRpc(), {
      eventId: ctx.event.id,
      staffId: ctx.user.id,
      ticketTypeId: d.ticketTypeId,
      quantity: d.quantity,
      buyerEmail: d.buyerEmail,
      buyerName: d.buyerName,
      buyerPhone: d.buyerPhone,
      attendees: d.attendees.slice(0, d.quantity).map((a) => ({ name: a.name, email: a.email || undefined })),
      mode: d.mode,
      paymentMethod: d.paymentMethod,
      notes: d.notes,
    });
    revalidatePath("/admin", "layout");
    return {
      ok: true,
      data: result,
      message:
        result.status === "paid"
          ? `Venta ${result.reference} registrada: ${result.tickets_issued} boleto(s) emitido(s).`
          : `Pedido ${result.reference} registrado con pago por confirmar. Los boletos no darán acceso hasta confirmar el pago.`,
    };
  } catch (error) {
    logError("manualSaleAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

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
