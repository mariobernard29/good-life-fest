"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { FEST } from "@/content/festival";
import { getCurrentEvent, isEventPublic } from "@/lib/events/current";
import { getRpc } from "@/lib/db/server-rpc";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoPaymentsEnabled } from "@/lib/env";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { AppError, logError, userMessage, type ActionResult } from "@/lib/errors";
import { fieldErrors, purchaseSchema, type PurchaseInput } from "@/lib/validation/schemas";

/** Retención mientras se completa el pago simulado. */
const HOLD_MINUTES = 15;
const DEMO_NOTE = "PAGO SIMULADO (demostración): no se realizó ningún cargo.";

type Hold = { order_id: string; reference: string; total_cents: number };

/**
 * Paso 1: aparta las entradas (pedido pendiente) para la cuenta con sesión.
 * Precios, disponibilidad y límites se calculan en la base de datos.
 */
export async function createPurchaseAction(input: PurchaseInput): Promise<ActionResult<{ orderId: string }>> {
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa tu selección.", fieldErrors: fieldErrors(parsed.error) };
  try {
    if (!FEST.onlineSales || !isDemoPaymentsEnabled()) throw new AppError("EVENT_NOT_ON_SALE");
    const user = await requireUser();
    await enforceRateLimit("purchase", 10, 60_000, user.id);
    const event = await getCurrentEvent();
    if (!isEventPublic(event)) throw new AppError("EVENT_NOT_ON_SALE");

    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();

    const hold = await getRpc().call<Hold>("create_order_hold", {
      p_event_id: event.id,
      p_items: parsed.data.items.map((i) => ({ ticket_type_id: i.ticketTypeId, quantity: i.quantity })),
      p_buyer_email: user.email,
      p_buyer_name: profile?.full_name ?? "",
      p_buyer_phone: profile?.phone ?? null,
      p_user_id: user.id,
      p_hold_minutes: HOLD_MINUTES,
    });
    return { ok: true, data: { orderId: hold.order_id } };
  } catch (error) {
    logError("createPurchaseAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

async function loadOwnPendingOrder(orderId: string) {
  const user = await requireUser();
  // Lectura con la sesión del usuario: RLS garantiza que el pedido es suyo.
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, status, total_cents, currency, expires_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) throw new AppError("ORDER_NOT_FOUND");
  return { user, order };
}

/**
 * Paso 2 (DEMO): confirma el pago sin cobrar y emite los boletos con la misma
 * función idempotente que usaría una pasarela real.
 */
export async function simulatePaymentAction(orderId: string): Promise<ActionResult<null>> {
  let reference: string;
  try {
    if (!FEST.onlineSales || !isDemoPaymentsEnabled()) throw new AppError("EVENT_NOT_ON_SALE");
    const { user, order } = await loadOwnPendingOrder(orderId);
    await enforceRateLimit("purchase-pay", 10, 60_000, user.id);
    if (order.status === "paid") redirect(`/mi-cuenta/entradas?compra=${order.reference}`);
    if (order.status !== "pending" || new Date(order.expires_at).getTime() <= Date.now()) {
      return { ok: false, error: "El apartado venció. Vuelve a elegir tus entradas." };
    }

    const result = await getRpc().call<{ status: string }>("fulfill_order_payment", {
      p_order_id: order.id,
      p_session_id: null,
      p_payment_intent_id: `demo_${order.id}`,
      p_amount_cents: order.total_cents,
      p_currency: order.currency,
    });
    if (result.status !== "fulfilled" && result.status !== "already_processed") {
      throw new AppError("ORDER_STATE_INVALID", result.status);
    }
    await createAdminClient().from("orders").update({ notes: DEMO_NOTE }).eq("id", order.id);
    reference = order.reference;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    logError("simulatePaymentAction", error);
    return { ok: false, error: userMessage(error) };
  }
  revalidatePath("/mi-cuenta", "layout");
  revalidatePath("/entradas");
  redirect(`/mi-cuenta/entradas?compra=${reference}`);
}

/** Cancela el apartado y libera las entradas de inmediato. */
export async function cancelPurchaseAction(orderId: string): Promise<ActionResult<null>> {
  try {
    const { order } = await loadOwnPendingOrder(orderId);
    if (order.status === "pending") {
      await getRpc().call("release_order", { p_order_id: order.id, p_status: "cancelled", p_reason: "cancelado por el comprador" });
    }
  } catch (error) {
    logError("cancelPurchaseAction", error);
    return { ok: false, error: userMessage(error) };
  }
  revalidatePath("/entradas");
  redirect("/entradas");
}
