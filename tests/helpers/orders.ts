import type { TestDb } from "./db";

export type OrderHold = { order_id: string; reference: string; total_cents: number };

export function hold(db: TestDb, eventId: string, ticketTypeId: string, quantity: number, email = "comprador@correo.mx", userId: string | null = null) {
  return db.rpc.call<OrderHold>("create_order_hold", {
    p_event_id: eventId,
    p_items: [{ ticket_type_id: ticketTypeId, quantity }],
    p_buyer_email: email,
    p_buyer_name: "Comprador Prueba",
    p_user_id: userId,
  });
}

/** Confirma el pago de un pedido (lo que haría la pasarela al integrarse). */
export function pay(db: TestDb, order: OrderHold, amount = order.total_cents, paymentRef = `pay_${order.order_id.slice(0, 8)}`) {
  return db.rpc.call<{ status: string; tickets_issued: number }>("fulfill_order_payment", {
    p_order_id: order.order_id,
    p_session_id: null,
    p_payment_intent_id: paymentRef,
    p_amount_cents: amount,
    p_currency: "mxn",
  });
}
