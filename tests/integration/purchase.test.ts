import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../helpers/db";
import { hold, pay } from "../helpers/orders";
import { AppError } from "@/lib/errors";

/**
 * Inventario y emisión de boletos a nivel de base de datos. La pasarela de pago
 * se retiró por ahora; estas funciones quedan listas para conectarse a una.
 */
async function ticketCount(db: TestDb, orderId: string) {
  const r = await db.pg.query<{ n: number }>(
    `select count(*)::int as n from tickets t join order_items oi on oi.id = t.order_item_id where oi.order_id = $1`,
    [orderId],
  );
  return r.rows[0].n;
}

async function available(db: TestDb, eventId: string) {
  const r = await db.rpc.call<{ available: number }[]>("get_ticket_availability", { p_event_id: eventId });
  return r[0].available;
}

describe("Inventario y emisión de boletos", () => {
  let db: TestDb;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("1. pago confirmado: emite un boleto individual con QR único por entrada", async () => {
    const { eventId, ticketTypeId } = await db.seedEvent({ price: 120000 });
    const order = await hold(db, eventId, ticketTypeId, 3);
    expect(order.total_cents).toBe(360000);
    expect(await ticketCount(db, order.order_id)).toBe(0);

    expect((await pay(db, order)).status).toBe("fulfilled");
    const tickets = await db.pg.query<{ qr_token: string; public_code: string; status: string }>(`select qr_token, public_code, status from tickets`);
    expect(tickets.rows).toHaveLength(3);
    expect(new Set(tickets.rows.map((t) => t.qr_token)).size).toBe(3);
    tickets.rows.forEach((t) => {
      expect(t.status).toBe("valid");
      expect(t.qr_token).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  it("2. confirmación repetida o simultánea no emite boletos adicionales", async () => {
    const { eventId, ticketTypeId } = await db.seedEvent();
    const order = await hold(db, eventId, ticketTypeId, 2);
    await Promise.all([pay(db, order), pay(db, order)]);
    expect((await pay(db, order)).status).toBe("already_processed");
    expect(await ticketCount(db, order.order_id)).toBe(2);
  });

  it("3. pedido no pagado o vencido: sin entradas y con inventario liberado; importe incorrecto no emite", async () => {
    const { eventId, ticketTypeId } = await db.seedEvent({ ticketQty: 5 });
    const failed = await hold(db, eventId, ticketTypeId, 2);
    const expired = await hold(db, eventId, ticketTypeId, 3);
    expect(await available(db, eventId)).toBe(0);
    await db.rpc.call("release_order", { p_order_id: failed.order_id, p_status: "failed", p_reason: "test" });
    await db.pg.query(`update orders set expires_at = now() - interval '1 minute' where id = $1`, [expired.order_id]);
    expect(await available(db, eventId)).toBe(5);
    expect(await ticketCount(db, failed.order_id)).toBe(0);

    const other = await hold(db, eventId, ticketTypeId, 1);
    expect((await pay(db, other, 100)).status).toBe("amount_mismatch");
    expect(await ticketCount(db, other.order_id)).toBe(0);
  });

  it("4. inventario insuficiente, límite por compra y capacidad global", async () => {
    const { eventId, ticketTypeId } = await db.seedEvent({ ticketQty: 2 });
    await expect(hold(db, eventId, ticketTypeId, 3)).rejects.toMatchObject({ code: "INSUFFICIENT_INVENTORY", detail: "2" });
    const ev2 = await db.seedEvent({ ticketQty: 100, maxPerOrder: 4, capacity: 3 });
    await expect(hold(db, ev2.eventId, ev2.ticketTypeId, 5)).rejects.toMatchObject({ code: "QUANTITY_LIMIT" });
    await expect(hold(db, ev2.eventId, ev2.ticketTypeId, 4)).rejects.toMatchObject({ code: "EVENT_CAPACITY_REACHED" });
  });

  it("5. dos solicitudes concurrentes por la última entrada: solo una obtiene la retención", async () => {
    const { eventId, ticketTypeId } = await db.seedEvent({ ticketQty: 1 });
    const results = await Promise.allSettled([hold(db, eventId, ticketTypeId, 1, "a@correo.mx"), hold(db, eventId, ticketTypeId, 1, "b@correo.mx")]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(AppError);
    expect(rejected.reason.code).toBe("INSUFFICIENT_INVENTORY");
  });

  it("reembolso total anula boletos y libera reservas", async () => {
    const { eventId, ticketTypeId } = await db.seedEvent();
    const userId = await db.createUser("comprador@correo.mx");
    const order = await hold(db, eventId, ticketTypeId, 1, "comprador@correo.mx", userId);
    await pay(db, order, order.total_cents, "pay_r1");
    const activityId = await db.seedActivity(eventId, { capacity: 5 });
    const ticket = (await db.pg.query<{ id: string }>(`select id from tickets limit 1`)).rows[0];
    await db.rpc.call("reserve_session", { p_profile_id: userId, p_ticket_id: ticket.id, p_activity_id: activityId });
    expect(await db.rpc.call("refund_order_payment", { p_payment_intent_id: "pay_r1", p_amount_refunded_cents: order.total_cents })).toMatchObject({ status: "refunded" });
    expect((await db.pg.query<{ status: string }>(`select status from tickets`)).rows[0].status).toBe("refunded");
    expect((await db.pg.query<{ status: string }>(`select status from reservations`)).rows[0].status).toBe("cancelled");
  });
});
