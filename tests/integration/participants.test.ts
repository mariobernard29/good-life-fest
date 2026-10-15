import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../helpers/db";
import { createManualSale } from "@/lib/orders/manual-sale";
import { setWristbandStatus } from "@/lib/tickets/wristband";
import { reserveSession } from "@/lib/reservations/service";
import { claimDueNotifications, claimDueReminders, notificationRecipients } from "@/lib/push/queue";

describe("Registro manual, pulseras y cola de notificaciones", () => {
  let db: TestDb;
  let eventId: string;
  let ticketTypeId: string;
  let seller: string;

  beforeEach(async () => {
    db = await createTestDb();
    ({ eventId, ticketTypeId } = await db.seedEvent());
    seller = await db.createStaff("taquilla@glf.mx", "ticketing_staff", eventId);
  });

  /** Simula el registro: cuenta creada por invitación (perfil por trigger) + boleto. */
  async function register(email: string, opts: { source?: "punto_fisico" | "mensaje"; delivered?: boolean } = {}) {
    const user = await db.pg.query<{ id: string }>(
      `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
      [email, JSON.stringify({ full_name: "Participante", phone: "6691234567", age: "34" })],
    );
    const userId = user.rows[0].id;
    const sale = await createManualSale(db.rpc, {
      eventId, staffId: seller, ticketTypeId, quantity: 1, buyerEmail: email, buyerName: "Participante",
      buyerPhone: "6691234567", attendees: [{ name: "Participante", email }], mode: "paid", paymentMethod: "cash",
      saleSource: opts.source ?? "punto_fisico", wristbandDelivered: opts.delivered ?? false,
    });
    const ticket = (
      await db.pg.query<{ id: string; owner_profile_id: string; wristband_delivered_at: string | null }>(
        `select t.id, t.owner_profile_id, t.wristband_delivered_at from tickets t
           join order_items oi on oi.id = t.order_item_id where oi.order_id = $1`,
        [sale.order_id],
      )
    ).rows[0];
    return { userId, sale, ticket };
  }

  it("el perfil guarda la edad del registro y el boleto queda vinculado a la cuenta sin activar", async () => {
    const { userId, sale, ticket } = await register("ana@correo.mx", { source: "mensaje" });
    const profile = (
      await db.pg.query<{ age: number; phone: string; activated_at: string | null }>(
        `select age, phone, activated_at from profiles where id = $1`, [userId],
      )
    ).rows[0];
    expect(profile).toMatchObject({ age: 34, phone: "6691234567", activated_at: null });
    expect(ticket.owner_profile_id).toBe(userId);
    expect(ticket.wristband_delivered_at).toBeNull();

    const order = (await db.pg.query<{ sale_source: string }>(`select sale_source from orders where id = $1`, [sale.order_id])).rows[0];
    expect(order.sale_source).toBe("mensaje");
  });

  it("claim_guest_tickets funciona con el rol service_role, que (como en Supabase) no puede leer auth.users", async () => {
    const email = "invitado@correo.mx";
    await createManualSale(db.rpc, {
      eventId, staffId: seller, ticketTypeId, quantity: 1, buyerEmail: email, buyerName: "Invitado",
      attendees: [], mode: "paid", paymentMethod: "cash",
    });
    const userId = await db.createUser(email);
    await db.pg.exec(`set role service_role`);
    try {
      await expect(db.pg.query(`select id from auth.users limit 1`)).rejects.toThrow(/permission denied/);
      const res = await db.pg.query<{ r: { claimed_tickets: number } }>(`select public.claim_guest_tickets($1) as r`, [userId]);
      expect(res.rows[0].r.claimed_tickets).toBe(1);
    } finally {
      await db.pg.exec(`reset role`);
    }
  });

  it("edades fuera de rango no se guardan y el origen de venta se valida", async () => {
    const res = await db.pg.query<{ id: string }>(
      `insert into auth.users (email, raw_user_meta_data) values ('x@correo.mx', '{"age":"500"}') returning id`,
    );
    const p = (await db.pg.query<{ age: number | null }>(`select age from profiles where id = $1`, [res.rows[0].id])).rows[0];
    expect(p.age).toBeNull();

    await expect(
      db.rpc.call("create_manual_sale", {
        p_event_id: eventId, p_staff_id: seller, p_ticket_type_id: ticketTypeId, p_quantity: 1,
        p_buyer_email: "y@correo.mx", p_buyer_name: "Y", p_buyer_phone: null, p_attendees: [],
        p_payment_method: "cash", p_payment_confirmed: true, p_complimentary: false, p_notes: null,
        p_sale_source: "internet", p_wristband_delivered: false,
      }),
    ).rejects.toMatchObject({ code: "INVALID_SALE_SOURCE" });
  });

  it("venta en punto físico con pulsera entregada; check-in y taquilla pueden cambiar el estado", async () => {
    const { ticket } = await register("beto@correo.mx", { delivered: true });
    expect(ticket.wristband_delivered_at).not.toBeNull();

    const checker = await db.createStaff("acceso@glf.mx", "checkin_staff", eventId);
    const pending = await setWristbandStatus(db.rpc, { ticketId: ticket.id, staffId: seller, delivered: false });
    expect(pending).toMatchObject({ changed: true, wristband_delivered_at: null });

    const again = await setWristbandStatus(db.rpc, { ticketId: ticket.id, staffId: checker, delivered: true });
    expect(again.changed).toBe(true);
    expect(again.wristband_delivered_at).not.toBeNull();
    expect((await setWristbandStatus(db.rpc, { ticketId: ticket.id, staffId: checker, delivered: true })).changed).toBe(false);

    const log = await db.pg.query<{ action: string }>(
      `select action from audit_logs where entity = 'ticket' and entity_id = $1 order by id`, [ticket.id],
    );
    expect(log.rows.map((r) => r.action)).toEqual(["ticket.wristband_pending", "ticket.wristband_delivered"]);
  });

  it("pulsera: personas sin rol o de otro evento no pueden cambiarla, ni en boletos anulados", async () => {
    const { userId, ticket } = await register("caro@correo.mx");
    await expect(setWristbandStatus(db.rpc, { ticketId: ticket.id, staffId: userId, delivered: true })).rejects.toMatchObject({ code: "FORBIDDEN" });

    const other = await db.seedEvent();
    const otherChecker = await db.createStaff("otro@glf.mx", "checkin_staff", other.eventId);
    await expect(setWristbandStatus(db.rpc, { ticketId: ticket.id, staffId: otherChecker, delivered: true })).rejects.toMatchObject({ code: "FORBIDDEN" });

    const admin = await db.createStaff("admin@glf.mx", "event_admin", eventId);
    await db.rpc.call("void_ticket", { p_ticket_id: ticket.id, p_actor_id: admin, p_reason: "duplicado" });
    await expect(setWristbandStatus(db.rpc, { ticketId: ticket.id, staffId: admin, delivered: true })).rejects.toMatchObject({ code: "TICKET_NOT_VALID" });
  });

  it("recordatorios: cada reserva confirmada sale una sola vez y solo dentro de la ventana", async () => {
    const soon = await db.seedActivity(eventId, { startsInHours: 0 }); // empieza "ahora": fuera (ya comenzó)
    await db.pg.query(`update activities set starts_at = now() + interval '20 minutes', ends_at = now() + interval '80 minutes' where id = $1`, [soon]);
    const later = await db.seedActivity(eventId, { startsInHours: 5 });

    const a = await register("dani@correo.mx");
    const b = await register("eva@correo.mx");
    await reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticket.id, kind: "activity", sessionId: soon });
    await reserveSession(db.rpc, { profileId: b.userId, ticketId: b.ticket.id, kind: "activity", sessionId: soon });
    await reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticket.id, kind: "activity", sessionId: later });
    await db.pg.query(
      `update reservations set status = 'cancelled', cancelled_at = now() where profile_id = $1 and activity_id = $2`,
      [b.userId, soon],
    );

    expect(await claimDueReminders(db.rpc, eventId, 0)).toEqual([]);
    const due = await claimDueReminders(db.rpc, eventId, 30);
    expect(due).toHaveLength(1);
    expect(due[0]).toMatchObject({ profile_id: a.userId, kind: "activity", name: "Yoga al amanecer" });
    expect(await claimDueReminders(db.rpc, eventId, 30)).toEqual([]);

    // Con una ventana más amplia entra la otra clase, pero nunca se repite la primera.
    const wide = await claimDueReminders(db.rpc, eventId, 6 * 60);
    expect(wide.map((r) => r.profile_id)).toEqual([a.userId]);
    expect(wide[0].reservation_id).not.toBe(due[0].reservation_id);
  });

  it("avisos programados: solo salen los vencidos, una vez, y llegan a la audiencia correcta", async () => {
    const activityId = await db.seedActivity(eventId);
    const a = await register("fer@correo.mx");
    const b = await register("gabi@correo.mx");
    await reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticket.id, kind: "activity", sessionId: activityId });
    for (const [i, user] of [a.userId, b.userId].entries()) {
      await db.pg.query(
        `insert into push_subscriptions (profile_id, endpoint, p256dh, auth) values ($1, $2, 'k', 's')`,
        [user, `https://push.example/${i}`],
      );
    }

    const ins = await db.pg.query<{ id: string }>(
      `insert into notifications (event_id, title, body, audience, activity_id, send_at)
       values ($1, 'Cambio de salón', 'Yoga se mueve al jardín', 'activity', $2, now() - interval '1 minute'),
              ($1, 'Bienvenida', 'Las puertas abren a las 8:00', 'all', null, now() - interval '2 minutes'),
              ($1, 'Más tarde', 'Todavía no', 'all', null, now() + interval '1 hour')
       returning id`,
      [eventId, activityId],
    );
    const [toClass, toAll] = ins.rows.map((r) => r.id);

    const due = await claimDueNotifications(db.rpc, eventId);
    expect(due.map((n) => n.title)).toEqual(["Bienvenida", "Cambio de salón"]);
    expect(await claimDueNotifications(db.rpc, eventId)).toEqual([]);

    const classTargets = await notificationRecipients(db.rpc, toClass);
    expect(classTargets.map((t) => t.profile_id)).toEqual([a.userId]);
    const allTargets = await notificationRecipients(db.rpc, toAll);
    expect(allTargets.map((t) => t.profile_id).sort()).toEqual([a.userId, b.userId].sort());

    // Navegador (authenticated) no puede leer suscripciones ni avisos.
    await expect(db.asUser(a.userId, `select * from push_subscriptions`)).rejects.toThrow(/permission denied/);
    await expect(db.asUser(a.userId, `select * from notifications`)).rejects.toThrow(/permission denied/);
  });
});
