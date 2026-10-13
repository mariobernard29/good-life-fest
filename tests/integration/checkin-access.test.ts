import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../helpers/db";
import { checkInTicket } from "@/lib/checkin/service";
import { buildQrPayload } from "@/lib/tickets/qr";
import { createManualSale, confirmManualPayment } from "@/lib/orders/manual-sale";
import { pay, type OrderHold } from "../helpers/orders";

describe("Check-in, permisos, ventas manuales y aislamiento de datos", () => {
  let db: TestDb;
  let eventId: string;
  let ticketTypeId: string;
  let checker: string;
  let seller: string;

  beforeEach(async () => {
    db = await createTestDb();
    ({ eventId, ticketTypeId } = await db.seedEvent({ ticketQty: 5 }));
    checker = await db.createStaff("acceso@glf.mx", "checkin_staff", eventId);
    seller = await db.createStaff("taquilla@glf.mx", "ticketing_staff", eventId);
  });

  async function sellOne(email = "asistente@correo.mx") {
    const sale = await createManualSale(db.rpc, {
      eventId, staffId: seller, ticketTypeId, quantity: 1, buyerEmail: email, buyerName: "Asistente",
      attendees: [{ name: "Lucía Pérez" }], mode: "paid", paymentMethod: "cash",
    });
    const t = await db.pg.query<{ qr_token: string; public_code: string }>(
      `select t.qr_token, t.public_code from tickets t join order_items oi on oi.id = t.order_item_id where oi.order_id = $1`,
      [sale.order_id],
    );
    return { sale, ticket: t.rows[0] };
  }

  it("9. segundo escaneo de un boleto ya utilizado es rechazado (también en escaneos simultáneos)", async () => {
    const { ticket } = await sellOne();
    const raw = buildQrPayload(ticket.qr_token);
    const first = await checkInTicket(db.rpc, { eventId, staffId: checker, raw, accessArea: "general", method: "scan" });
    expect(first.result).toBe("accepted");
    expect(first.ticket?.attendee_name).toBe("Lucía Pérez");

    const second = await checkInTicket(db.rpc, { eventId, staffId: checker, raw, accessArea: "general", method: "scan" });
    expect(second.result).toBe("already_used");

    // Dos dispositivos al mismo tiempo con otro boleto: exactamente un acceso autorizado.
    const { ticket: t2 } = await sellOne("otro@correo.mx");
    const both = await Promise.all([
      checkInTicket(db.rpc, { eventId, staffId: checker, raw: buildQrPayload(t2.qr_token), accessArea: "general", method: "scan" }),
      checkInTicket(db.rpc, { eventId, staffId: checker, raw: t2.public_code, accessArea: "general", method: "manual" }),
    ]);
    expect(both.map((r) => r.result).sort()).toEqual(["accepted", "already_used"]);

    const log = await db.pg.query<{ result: string }>(`select result from check_ins order by created_at`);
    expect(log.rows).toHaveLength(4);
  });

  it("estados del check-in: inválido, pago pendiente, cancelado, otro evento y zona no incluida", async () => {
    const invalid = await checkInTicket(db.rpc, { eventId, staffId: checker, raw: buildQrPayload("f".repeat(64)), accessArea: "general", method: "scan" });
    expect(invalid.result).toBe("invalid");
    expect((await checkInTicket(db.rpc, { eventId, staffId: checker, raw: "texto cualquiera", accessArea: "general", method: "scan" })).result).toBe("invalid");

    const pending = await createManualSale(db.rpc, {
      eventId, staffId: seller, ticketTypeId, quantity: 1, buyerEmail: "transfer@correo.mx", buyerName: "T",
      attendees: [], mode: "pending", paymentMethod: "transfer",
    });
    const pt = (await db.pg.query<{ public_code: string }>(`select public_code from tickets where status = 'pending_payment'`)).rows[0];
    expect((await checkInTicket(db.rpc, { eventId, staffId: checker, raw: pt.public_code, accessArea: "general", method: "manual" })).result).toBe("payment_pending");
    await confirmManualPayment(db.rpc, pending.order_id, seller);
    expect((await checkInTicket(db.rpc, { eventId, staffId: checker, raw: pt.public_code, accessArea: "general", method: "manual" })).result).toBe("accepted");

    const { ticket } = await sellOne("vip@correo.mx");
    expect((await checkInTicket(db.rpc, { eventId, staffId: checker, raw: ticket.public_code, accessArea: "vip", method: "manual" })).result).toBe("not_allowed");

    const admin = await db.createStaff("admin@glf.mx", "event_admin", eventId);
    const tid = (await db.pg.query<{ id: string }>(`select id from tickets where public_code = $1`, [ticket.public_code])).rows[0].id;
    await db.rpc.call("void_ticket", { p_ticket_id: tid, p_actor_id: admin, p_reason: "duplicado" });
    expect((await checkInTicket(db.rpc, { eventId, staffId: checker, raw: ticket.public_code, accessArea: "general", method: "manual" })).result).toBe("cancelled");

    const other = await db.seedEvent();
    const otherChecker = await db.createStaff("acceso2@glf.mx", "checkin_staff", other.eventId);
    const { ticket: t3 } = await sellOne("x@correo.mx");
    expect((await checkInTicket(db.rpc, { eventId: other.eventId, staffId: otherChecker, raw: t3.public_code, accessArea: "general", method: "manual" })).result).toBe("wrong_event");
  });

  it("10. usuarios sin permisos no pueden validar, vender ni emitir cortesías", async () => {
    const { ticket } = await sellOne();
    const attendee = await db.createUser("curioso@correo.mx");

    await expect(
      checkInTicket(db.rpc, { eventId, staffId: attendee, raw: ticket.public_code, accessArea: "general", method: "manual" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await expect(
      createManualSale(db.rpc, {
        eventId, staffId: checker, ticketTypeId, quantity: 1, buyerEmail: "a@correo.mx", buyerName: "A",
        attendees: [], mode: "paid", paymentMethod: "cash",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    // Taquilla sin permiso adicional no emite cortesías.
    await expect(
      createManualSale(db.rpc, {
        eventId, staffId: seller, ticketTypeId, quantity: 1, buyerEmail: "a@correo.mx", buyerName: "A",
        attendees: [], mode: "complimentary", notes: "Invitado especial",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN_COMPLIMENTARY" });

    // Personal de otro evento tampoco.
    const other = await db.seedEvent();
    const foreign = await db.createStaff("ajeno@glf.mx", "event_admin", other.eventId);
    await expect(
      checkInTicket(db.rpc, { eventId, staffId: foreign, raw: ticket.public_code, accessArea: "general", method: "manual" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    // Con permiso explícito sí, y queda auditada como cortesía.
    const vipSeller = await db.createStaff("cortesias@glf.mx", "ticketing_staff", eventId, ["issue_complimentary"]);
    const comp = await createManualSale(db.rpc, {
      eventId, staffId: vipSeller, ticketTypeId, quantity: 1, buyerEmail: "prensa@correo.mx", buyerName: "Prensa",
      attendees: [], mode: "complimentary", notes: "Acreditación de prensa",
    });
    expect(comp.total_cents).toBe(0);
    const audit = await db.pg.query<{ actor_id: string }>(`select actor_id from audit_logs where action = 'order.complimentary_issued'`);
    expect(audit.rows[0].actor_id).toBe(vipSeller);
  });

  it("11. el registro manual respeta el mismo inventario que la venta en línea", async () => {
    // 5 disponibles: 3 retenidas en línea, quedan 2 para taquilla.
    await db.rpc.call<OrderHold>("create_order_hold", {
      p_event_id: eventId, p_items: [{ ticket_type_id: ticketTypeId, quantity: 3 }], p_buyer_email: "web@correo.mx", p_buyer_name: "Web",
    });
    await expect(
      createManualSale(db.rpc, {
        eventId, staffId: seller, ticketTypeId, quantity: 3, buyerEmail: "fisica@correo.mx", buyerName: "F",
        attendees: [], mode: "paid", paymentMethod: "cash",
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_INVENTORY", detail: "2" });

    const ok = await createManualSale(db.rpc, {
      eventId, staffId: seller, ticketTypeId, quantity: 2, buyerEmail: "fisica@correo.mx", buyerName: "F",
      attendees: [{ name: "Uno" }, { name: "Dos", email: "dos@correo.mx" }], mode: "paid", paymentMethod: "card_terminal",
    });
    expect(ok).toMatchObject({ status: "paid", tickets_issued: 2 });
    const names = await db.pg.query<{ attendee_name: string }>(`select attendee_name from tickets order by attendee_name`);
    expect(names.rows.map((r) => r.attendee_name)).toEqual(["Dos", "Uno"]);
    const order = await db.pg.query<{ created_by: string; channel: string }>(`select created_by, channel from orders where id = $1`, [ok.order_id]);
    expect(order.rows[0]).toMatchObject({ created_by: seller, channel: "box_office" });

    await expect(
      db.rpc.call("create_order_hold", {
        p_event_id: eventId, p_items: [{ ticket_type_id: ticketTypeId, quantity: 1 }], p_buyer_email: "tarde@correo.mx", p_buyer_name: "T",
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_INVENTORY" });
  });

  it("12. un usuario no puede ver entradas, pedidos ni reservas de otra persona (RLS)", async () => {
    const ana = await db.createUser("ana@correo.mx");
    const beto = await db.createUser("beto@correo.mx");
    for (const [userId, email] of [[ana, "ana@correo.mx"], [beto, "beto@correo.mx"]] as const) {
      const order = await db.rpc.call<OrderHold>("create_order_hold", {
        p_event_id: eventId, p_items: [{ ticket_type_id: ticketTypeId, quantity: 1 }], p_buyer_email: email, p_buyer_name: email, p_user_id: userId,
      });
      await pay(db, order, order.total_cents, `pi_${email}`);
    }

    const anaTickets = await db.asUser<{ owner_profile_id: string }>(ana, `select owner_profile_id from tickets`);
    expect(anaTickets).toHaveLength(1);
    expect(anaTickets[0].owner_profile_id).toBe(ana);

    const betoTicketId = (await db.pg.query<{ id: string }>(`select id from tickets where owner_profile_id = $1`, [beto])).rows[0].id;
    expect(await db.asUser(ana, `select * from tickets where id = $1`, [betoTicketId])).toHaveLength(0);
    expect(await db.asUser(ana, `select * from orders`)).toHaveLength(1);
    expect(await db.asUser(ana, `select * from profiles`)).toHaveLength(1);

    // Sin acceso a tablas operativas ni a funciones de negocio desde el rol del navegador.
    await expect(db.asUser(ana, `select * from check_ins`)).rejects.toThrow(/permission denied/);
    await expect(db.asUser(ana, `select * from audit_logs`)).rejects.toThrow(/permission denied/);
    await expect(
      db.asUser(ana, `select public.check_in_ticket($1, $2, null, 'GL-00000-00000')`, [eventId, ana]),
    ).rejects.toThrow(/permission denied/);
    await expect(db.asUser(ana, `update tickets set owner_profile_id = $1 where id = $2`, [ana, betoTicketId])).rejects.toThrow(/permission denied/);

    // Tampoco puede usar el boleto de otra persona para reservar.
    const act = await db.seedActivity(eventId);
    await expect(
      db.rpc.call("reserve_session", { p_profile_id: ana, p_ticket_id: betoTicketId, p_activity_id: act }),
    ).rejects.toMatchObject({ code: "TICKET_NOT_OWNED" });

    // Solo puede editar nombre y teléfono de su propio perfil.
    await db.asUser(ana, `update profiles set full_name = 'Ana María' where id = $1`, [beto]);
    expect((await db.pg.query<{ full_name: string }>(`select full_name from profiles where id = $1`, [beto])).rows[0].full_name).toBe("beto@correo.mx");
    await expect(db.asUser(ana, `update profiles set email = 'x@x.mx' where id = $1`, [ana])).rejects.toThrow(/permission denied/);
  });

  it("compra como invitado: se vincula a la cuenta solo cuando el correo está verificado", async () => {
    const order = await db.rpc.call<OrderHold>("create_order_hold", {
      p_event_id: eventId, p_items: [{ ticket_type_id: ticketTypeId, quantity: 2 }], p_buyer_email: "invitada@correo.mx", p_buyer_name: "Invitada",
    });
    await pay(db, order, order.total_cents, "pi_guest");

    const unverified = await db.createUser("invitada@correo.mx", { confirmed: false });
    expect(await db.rpc.call("claim_guest_tickets", { p_user_id: unverified })).toMatchObject({ claimed_tickets: 0, reason: "email_not_verified" });
    expect(await db.asUser(unverified, `select * from tickets`)).toHaveLength(0);

    await db.pg.query(`update auth.users set email_confirmed_at = now() where id = $1`, [unverified]);
    expect(await db.rpc.call("claim_guest_tickets", { p_user_id: unverified })).toMatchObject({ claimed_orders: 1, claimed_tickets: 2 });
    expect(await db.asUser(unverified, `select * from tickets`)).toHaveLength(2);

    // Otro usuario con un correo distinto no puede reclamarlos.
    const intruder = await db.createUser("intruso@correo.mx");
    expect(await db.rpc.call("claim_guest_tickets", { p_user_id: intruder })).toMatchObject({ claimed_tickets: 0 });
  });
});
