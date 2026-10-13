import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../helpers/db";
import { cancelReservation, reserveSession, updateSessionCapacity } from "@/lib/reservations/service";
import { createManualSale } from "@/lib/orders/manual-sale";

/** Crea N asistentes, cada uno con un boleto válido (vía venta en taquilla). */
async function attendees(db: TestDb, eventId: string, ticketTypeId: string, n: number) {
  const staff = await db.createStaff(`taquilla-${Math.random()}@glf.mx`, "ticketing_staff", eventId);
  const out: { userId: string; ticketId: string }[] = [];
  for (let i = 0; i < n; i++) {
    const email = `asistente${i}-${Math.random().toString(36).slice(2, 6)}@correo.mx`;
    const userId = await db.createUser(email);
    await createManualSale(db.rpc, {
      eventId, staffId: staff, ticketTypeId, quantity: 1, buyerEmail: email, buyerName: `Asistente ${i}`,
      attendees: [], mode: "paid", paymentMethod: "cash",
    });
    const t = await db.pg.query<{ id: string }>(`select id from tickets where owner_profile_id = $1`, [userId]);
    out.push({ userId, ticketId: t.rows[0].id });
  }
  return out;
}

async function confirmed(db: TestDb, activityId: string) {
  return (
    await db.pg.query<{ n: number }>(`select count(*)::int n from reservations where activity_id = $1 and status = 'confirmed'`, [activityId])
  ).rows[0].n;
}

describe("Reservas de clases y conferencias", () => {
  let db: TestDb;
  let eventId: string;
  let ticketTypeId: string;

  beforeEach(async () => {
    db = await createTestDb();
    ({ eventId, ticketTypeId } = await db.seedEvent());
  });

  it("6. reserva la última plaza y rechaza la siguiente (sin consumir inventario de entradas)", async () => {
    const activityId = await db.seedActivity(eventId, { capacity: 2 });
    const [a, b, c] = await attendees(db, eventId, ticketTypeId, 3);
    const before = await db.rpc.call<{ available: number }[]>("get_ticket_availability", { p_event_id: eventId });

    await reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticketId, kind: "activity", sessionId: activityId });
    const last = await reserveSession(db.rpc, { profileId: b.userId, ticketId: b.ticketId, kind: "activity", sessionId: activityId });
    expect(last).toMatchObject({ status: "confirmed", remaining: 0 });

    await expect(
      reserveSession(db.rpc, { profileId: c.userId, ticketId: c.ticketId, kind: "activity", sessionId: activityId }),
    ).rejects.toMatchObject({ code: "SESSION_FULL" });

    const after = await db.rpc.call<{ available: number }[]>("get_ticket_availability", { p_event_id: eventId });
    expect(after[0].available).toBe(before[0].available); // capacidad independiente
    expect(await confirmed(db, activityId)).toBe(2);
  });

  it("7. dos solicitudes simultáneas por el mismo cupo: solo una se confirma", async () => {
    const activityId = await db.seedActivity(eventId, { capacity: 1 });
    const [a, b] = await attendees(db, eventId, ticketTypeId, 2);
    const results = await Promise.allSettled([
      reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticketId, kind: "activity", sessionId: activityId }),
      reserveSession(db.rpc, { profileId: b.userId, ticketId: b.ticketId, kind: "activity", sessionId: activityId }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(await confirmed(db, activityId)).toBe(1);

    // El mismo usuario duplicando su reserva (doble clic) tampoco pasa.
    const activity2 = await db.seedActivity(eventId, { capacity: 10, startsInHours: 72 });
    const dup = await Promise.allSettled([
      reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticketId, kind: "activity", sessionId: activity2 }),
      reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticketId, kind: "activity", sessionId: activity2 }),
    ]);
    expect(dup.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((dup.find((r) => r.status === "rejected") as PromiseRejectedResult).reason.code).toBe("ALREADY_RESERVED");
  });

  it("8. cancelar libera el lugar y promueve la lista de espera en orden FIFO", async () => {
    const activityId = await db.seedActivity(eventId, { capacity: 1, waitlist: true });
    const [a, b, c] = await attendees(db, eventId, ticketTypeId, 3);
    const ra = await reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticketId, kind: "activity", sessionId: activityId });
    const rb = await reserveSession(db.rpc, { profileId: b.userId, ticketId: b.ticketId, kind: "activity", sessionId: activityId });
    const rc = await reserveSession(db.rpc, { profileId: c.userId, ticketId: c.ticketId, kind: "activity", sessionId: activityId });
    expect(rb).toMatchObject({ status: "waitlisted", waitlist_position: 1 });
    expect(rc).toMatchObject({ status: "waitlisted", waitlist_position: 2 });

    // Otro usuario no puede cancelar una reserva ajena.
    await expect(cancelReservation(db.rpc, { reservationId: ra.reservation_id, actorId: b.userId })).rejects.toMatchObject({
      code: "RESERVATION_NOT_FOUND",
    });

    const res = await cancelReservation(db.rpc, { reservationId: ra.reservation_id, actorId: a.userId });
    expect(res.promoted).toEqual([rb.reservation_id]);
    const rows = await db.pg.query<{ id: string; status: string }>(`select id, status from reservations order by reserved_at`);
    expect(rows.rows.map((r) => r.status)).toEqual(["cancelled", "confirmed", "waitlisted"]);
    expect(await confirmed(db, activityId)).toBe(1);

    // Sin lista de espera: el lugar simplemente vuelve a estar disponible.
    const act2 = await db.seedActivity(eventId, { capacity: 1, startsInHours: 96 });
    const r1 = await reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticketId, kind: "activity", sessionId: act2 });
    await cancelReservation(db.rpc, { reservationId: r1.reservation_id, actorId: a.userId });
    await expect(
      reserveSession(db.rpc, { profileId: c.userId, ticketId: c.ticketId, kind: "activity", sessionId: act2 }),
    ).resolves.toMatchObject({ status: "confirmed" });
  });

  it("reglas: boleto ajeno, traslape de horario, ventana de cancelación y sesiones no publicadas", async () => {
    const [a, b] = await attendees(db, eventId, ticketTypeId, 2);
    const act1 = await db.seedActivity(eventId, { capacity: 5, startsInHours: 48 });
    const overlapping = await db.seedActivity(eventId, { capacity: 5, startsInHours: 48 });
    const soon = await db.seedActivity(eventId, { capacity: 5, startsInHours: 0 }); // ya iniciada

    await expect(
      reserveSession(db.rpc, { profileId: a.userId, ticketId: b.ticketId, kind: "activity", sessionId: act1 }),
    ).rejects.toMatchObject({ code: "TICKET_NOT_OWNED" });
    await expect(
      reserveSession(db.rpc, { profileId: a.userId, ticketId: null, kind: "activity", sessionId: act1 }),
    ).rejects.toMatchObject({ code: "TICKET_REQUIRED" });

    await reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticketId, kind: "activity", sessionId: act1 });
    await expect(
      reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticketId, kind: "activity", sessionId: overlapping }),
    ).rejects.toMatchObject({ code: "SCHEDULE_CONFLICT" });
    await expect(
      reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticketId, kind: "activity", sessionId: soon }),
    ).rejects.toMatchObject({ code: "SESSION_STARTED" });

    await db.pg.query(`update activities set status = 'closed' where id = $1`, [overlapping]);
    await expect(
      reserveSession(db.rpc, { profileId: b.userId, ticketId: b.ticketId, kind: "activity", sessionId: overlapping }),
    ).rejects.toMatchObject({ code: "SESSION_NOT_BOOKABLE" });

    // Ventana de cancelación: 60 min antes por defecto.
    const late = await db.seedActivity(eventId, { capacity: 5, startsInHours: 100 });
    const r = await reserveSession(db.rpc, { profileId: b.userId, ticketId: b.ticketId, kind: "activity", sessionId: late });
    await db.pg.query(`update activities set starts_at = now() + interval '30 minutes', ends_at = now() + interval '90 minutes' where id = $1`, [late]);
    await expect(cancelReservation(db.rpc, { reservationId: r.reservation_id, actorId: b.userId })).rejects.toMatchObject({
      code: "CANCELLATION_WINDOW_CLOSED",
    });
    // Un administrador sí puede cancelar.
    await expect(
      cancelReservation(db.rpc, { reservationId: r.reservation_id, actorId: b.userId, asAdmin: true }),
    ).resolves.toMatchObject({ cancelled: true });
  });

  it("conferencias con reserva usan la misma lógica de cupo; sin reserva son de acceso libre", async () => {
    const [a, b] = await attendees(db, eventId, ticketTypeId, 2);
    const conf = await db.pg.query<{ id: string }>(
      `insert into conferences (event_id, title, starts_at, ends_at, capacity, requires_reservation, status)
       values ($1, 'Longevidad', now() + interval '2 days', now() + interval '2 days 1 hour', 1, true, 'published') returning id`,
      [eventId],
    );
    const open = await db.pg.query<{ id: string }>(
      `insert into conferences (event_id, title, starts_at, ends_at, capacity, requires_reservation, status)
       values ($1, 'Abierta', now() + interval '3 days', now() + interval '3 days 1 hour', 100, false, 'published') returning id`,
      [eventId],
    );
    await reserveSession(db.rpc, { profileId: a.userId, ticketId: a.ticketId, kind: "conference", sessionId: conf.rows[0].id });
    await expect(
      reserveSession(db.rpc, { profileId: b.userId, ticketId: b.ticketId, kind: "conference", sessionId: conf.rows[0].id }),
    ).rejects.toMatchObject({ code: "SESSION_FULL" });
    await expect(
      reserveSession(db.rpc, { profileId: b.userId, ticketId: b.ticketId, kind: "conference", sessionId: open.rows[0].id }),
    ).rejects.toMatchObject({ code: "RESERVATION_NOT_REQUIRED" });

    // La restricción de la BD impide una reserva ligada a clase y conferencia a la vez.
    const act = await db.seedActivity(eventId);
    await expect(
      db.pg.query(
        `insert into reservations (event_id, profile_id, ticket_id, activity_id, conference_id, status) values ($1,$2,$3,$4,$5,'confirmed')`,
        [eventId, a.userId, a.ticketId, act, conf.rows[0].id],
      ),
    ).rejects.toThrow(/reservations_one_target/);
  });

  it("reducir cupo por debajo de las reservas exige una resolución explícita", async () => {
    const activityId = await db.seedActivity(eventId, { capacity: 3 });
    const people = await attendees(db, eventId, ticketTypeId, 3);
    for (const p of people) {
      await reserveSession(db.rpc, { profileId: p.userId, ticketId: p.ticketId, kind: "activity", sessionId: activityId });
    }
    const admin = await db.createStaff("admin@glf.mx", "event_admin", eventId);

    await expect(
      updateSessionCapacity(db.rpc, { kind: "activity", sessionId: activityId, capacity: 1, resolution: null, actorId: admin }),
    ).rejects.toMatchObject({ code: "CAPACITY_BELOW_RESERVATIONS", detail: "3" });

    const moved = await updateSessionCapacity(db.rpc, {
      kind: "activity", sessionId: activityId, capacity: 1, resolution: "move_excess_to_waitlist", actorId: admin,
    });
    expect(moved).toMatchObject({ moved_to_waitlist: 2, overbooked: 0 });
    expect(await confirmed(db, activityId)).toBe(1);

    // Ampliar el cupo promueve la lista de espera.
    const grown = await updateSessionCapacity(db.rpc, { kind: "activity", sessionId: activityId, capacity: 3, resolution: null, actorId: admin });
    expect(grown.confirmed).toBe(3);
    const audit = await db.pg.query(`select * from audit_logs where action = 'session.capacity_changed'`);
    expect(audit.rows).toHaveLength(2);
  });
});
