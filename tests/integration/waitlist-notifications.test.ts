import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../helpers/db";
import { cancelReservation, reserveSession, updateSessionCapacity } from "@/lib/reservations/service";
import { createManualSale } from "@/lib/orders/manual-sale";
import { claimPromotedReservations } from "@/lib/push/queue";
import { promotionText } from "@/lib/push/dispatch";
import { formatTime } from "@/lib/format";

/** Crea N asistentes, cada uno con un boleto válido (vía venta en taquilla). */
async function attendees(db: TestDb, eventId: string, ticketTypeId: string, n: number) {
  const staff = await db.createStaff(`taquilla-${Math.random()}@glf.mx`, "ticketing_staff", eventId);
  const out: { userId: string; ticketId: string }[] = [];
  for (let i = 0; i < n; i++) {
    const email = `espera${i}-${Math.random().toString(36).slice(2, 6)}@correo.mx`;
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

describe("Aviso al salir de la lista de espera", () => {
  let db: TestDb;
  let eventId: string;
  let ticketTypeId: string;

  beforeEach(async () => {
    db = await createTestDb();
    ({ eventId, ticketTypeId } = await db.seedEvent());
  });

  /** Reserva a cada persona en orden (las que no caben quedan en lista de espera). */
  async function book(activityId: string, people: { userId: string; ticketId: string }[]) {
    const out = [];
    for (const p of people) {
      out.push(await reserveSession(db.rpc, { profileId: p.userId, ticketId: p.ticketId, kind: "activity", sessionId: activityId }));
    }
    return out;
  }

  it("al cancelar, la reserva promovida recibe un solo aviso con los datos de la clase", async () => {
    const activityId = await db.seedActivity(eventId, { capacity: 1, waitlist: true });
    await db.pg.query(`update activities set location = 'Jardín norte' where id = $1`, [activityId]);
    const [a, b, c] = await attendees(db, eventId, ticketTypeId, 3);
    const [ra, rb, rc] = await book(activityId, [a, b, c]);
    expect([rb.status, rc.status]).toEqual(["waitlisted", "waitlisted"]);

    // Nada que avisar mientras nadie haya sido promovido.
    expect(await claimPromotedReservations(db.rpc, eventId)).toEqual([]);

    const res = await cancelReservation(db.rpc, { reservationId: ra.reservation_id, actorId: a.userId });
    expect(res.promoted).toEqual([rb.reservation_id]);

    // Envío inmediato con los ids que regresó la cancelación.
    const now = await claimPromotedReservations(db.rpc, eventId, res.promoted);
    expect(now).toHaveLength(1);
    expect(now[0]).toMatchObject({
      reservation_id: rb.reservation_id, profile_id: b.userId, kind: "activity", name: "Yoga al amanecer", location: "Jardín norte",
    });

    // Ni la acción ni el despachador lo vuelven a enviar; quien sigue en espera no recibe nada.
    expect(await claimPromotedReservations(db.rpc, eventId, res.promoted)).toEqual([]);
    expect(await claimPromotedReservations(db.rpc, eventId)).toEqual([]);
    const marked = await db.pg.query<{ id: string }>(`select id from reservations where promotion_notified_at is not null`);
    expect(marked.rows.map((r) => r.id)).toEqual([rb.reservation_id]);

    const text = promotionText(now[0], "America/Mazatlan");
    expect(text).toMatchObject({ title: "¡Se liberó un lugar!", url: "/mi-cuenta/reservas", tag: `lugar-${rb.reservation_id}` });
    expect(text.body).toBe(
      `Ya tienes confirmada tu clase Yoga al amanecer a las ${formatTime(now[0].starts_at, "America/Mazatlan")}.`,
    );
  });

  it("el despachador recoge las promociones por ampliar cupo y por boleto anulado", async () => {
    const activityId = await db.seedActivity(eventId, { capacity: 1, waitlist: true });
    const [a, b, c, d] = await attendees(db, eventId, ticketTypeId, 4);
    const [, rb, rc, rd] = await book(activityId, [a, b, c, d]);
    const admin = await db.createStaff("admin@glf.mx", "event_admin", eventId);

    const grown = await updateSessionCapacity(db.rpc, { kind: "activity", sessionId: activityId, capacity: 2, resolution: null, actorId: admin });
    expect(grown.promoted).toEqual([rb.reservation_id]);
    await db.rpc.call("void_ticket", { p_ticket_id: a.ticketId, p_actor_id: admin, p_reason: "duplicado" });

    // Una reserva de otro evento no entra en el reclamo de este.
    const other = await db.seedEvent();
    expect(await claimPromotedReservations(db.rpc, other.eventId)).toEqual([]);

    const due = await claimPromotedReservations(db.rpc, eventId);
    expect(due.map((r) => r.reservation_id).sort()).toEqual([rb.reservation_id, rc.reservation_id].sort());
    expect(due.map((r) => r.profile_id).sort()).toEqual([b.userId, c.userId].sort());
    expect(await claimPromotedReservations(db.rpc, eventId)).toEqual([]);

    const waiting = await db.pg.query<{ status: string }>(`select status from reservations where id = $1`, [rd.reservation_id]);
    expect(waiting.rows[0].status).toBe("waitlisted");
  });

  it("volver a la lista de espera y ser promovida otra vez genera un aviso nuevo", async () => {
    const activityId = await db.seedActivity(eventId, { capacity: 2, waitlist: true });
    const [a, x, b] = await attendees(db, eventId, ticketTypeId, 3);
    const [ra, , rb] = await book(activityId, [a, x, b]);
    const admin = await db.createStaff("admin@glf.mx", "event_admin", eventId);

    await cancelReservation(db.rpc, { reservationId: ra.reservation_id, actorId: a.userId });
    expect((await claimPromotedReservations(db.rpc, eventId)).map((r) => r.reservation_id)).toEqual([rb.reservation_id]);

    // Reducir el cupo regresa a b (la más reciente) a la lista de espera: no hay aviso.
    const shrunk = await updateSessionCapacity(db.rpc, {
      kind: "activity", sessionId: activityId, capacity: 1, resolution: "move_excess_to_waitlist", actorId: admin,
    });
    expect(shrunk.moved_to_waitlist).toBe(1);
    expect(await claimPromotedReservations(db.rpc, eventId)).toEqual([]);

    // Al ampliarlo de nuevo, b vuelve a confirmarse y recibe un aviso nuevo (uno solo).
    const grown = await updateSessionCapacity(db.rpc, { kind: "activity", sessionId: activityId, capacity: 2, resolution: null, actorId: admin });
    expect(grown.promoted).toEqual([rb.reservation_id]);
    expect((await claimPromotedReservations(db.rpc, eventId)).map((r) => r.reservation_id)).toEqual([rb.reservation_id]);
    expect(await claimPromotedReservations(db.rpc, eventId)).toEqual([]);
  });

  it("no avisa reservas canceladas antes del envío ni sesiones que ya empezaron", async () => {
    const first = await db.seedActivity(eventId, { capacity: 1, waitlist: true, startsInHours: 24 });
    const second = await db.seedActivity(eventId, { capacity: 1, waitlist: true, startsInHours: 48 });
    const [a, b] = await attendees(db, eventId, ticketTypeId, 2);
    const [firstA, firstB] = await book(first, [a, b]);
    const [secondB, secondA] = await book(second, [b, a]);

    // b sale de la espera en la primera clase pero cancela antes de que salga el aviso.
    await cancelReservation(db.rpc, { reservationId: firstA.reservation_id, actorId: a.userId });
    await cancelReservation(db.rpc, { reservationId: firstB.reservation_id, actorId: b.userId });

    // a sale de la espera en la segunda clase, pero la clase empieza antes del despacho.
    const res = await cancelReservation(db.rpc, { reservationId: secondB.reservation_id, actorId: b.userId });
    expect(res.promoted).toEqual([secondA.reservation_id]);
    await db.pg.query(`update activities set starts_at = now() - interval '1 minute' where id = $1`, [second]);

    expect(await claimPromotedReservations(db.rpc, eventId)).toEqual([]);
    expect(await claimPromotedReservations(db.rpc, eventId, [])).toEqual([]);
    const marked = await db.pg.query(`select id from reservations where promotion_notified_at is not null`);
    expect(marked.rows).toHaveLength(0);
  });

  it("dos reclamos simultáneos (acción y despachador) entregan un solo aviso; el navegador no puede reclamar", async () => {
    const activityId = await db.seedActivity(eventId, { capacity: 1, waitlist: true });
    const [a, b] = await attendees(db, eventId, ticketTypeId, 2);
    const [ra, rb] = await book(activityId, [a, b]);
    const res = await cancelReservation(db.rpc, { reservationId: ra.reservation_id, actorId: a.userId, asAdmin: true });
    expect(res.promoted).toEqual([rb.reservation_id]);

    const [fromAction, fromCron] = await Promise.all([
      claimPromotedReservations(db.rpc, eventId, res.promoted),
      claimPromotedReservations(db.rpc, eventId),
    ]);
    expect(fromAction.length + fromCron.length).toBe(1);

    await expect(
      db.asUser(b.userId, `select public.claim_promoted_reservations($1)`, [eventId]),
    ).rejects.toThrow(/permission denied/);
  });
});
