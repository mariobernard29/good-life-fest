import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/errors";
import type { ParticipantSource, ReservationSource, SessionSource } from "@/lib/exports/rows";

/** PostgREST devuelve como máximo 1000 filas por consulta: se lee en bloques. */
const CHUNK = 1000;

async function readAll<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) {
  const out: T[] = [];
  for (let from = 0; ; from += CHUNK) {
    const { data, error } = await page(from, from + CHUNK - 1);
    if (error) throw new AppError("UNKNOWN", error.message);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < CHUNK) return out;
  }
}

/** Todas las entradas activas del evento (una por persona) con su cuenta y pedido. */
export function fetchParticipants(eventId: string) {
  const admin = createAdminClient();
  return readAll<ParticipantSource>((from, to) =>
    admin
      .from("tickets")
      .select(
        "public_code, attendee_name, attendee_email, status, issued_at, checked_in_at, wristband_delivered_at, ticket_types(name), profiles(full_name, email, phone, age, activated_at), order_items(orders(buyer_name, buyer_email, buyer_phone, status, channel, sale_source))",
      )
      .eq("event_id", eventId)
      .in("status", ["valid", "checked_in", "pending_payment"])
      .order("id")
      .range(from, to),
  );
}

export type SessionFilter = { activityId?: string; conferenceId?: string };

/** Sesiones con reserva (clases/actividades y conferencias con reserva) y sus reservas activas. */
export async function fetchClassRosterSources(eventId: string, filter: SessionFilter = {}) {
  const admin = createAdminClient();
  const only = filter.activityId ? "activity" : filter.conferenceId ? "conference" : null;

  let activitiesQuery = admin.from("activities").select("id, name, starts_at, ends_at, location, capacity").eq("event_id", eventId).neq("status", "draft");
  if (filter.activityId) activitiesQuery = activitiesQuery.eq("id", filter.activityId);
  let conferencesQuery = admin
    .from("conferences")
    .select("id, title, starts_at, ends_at, location, capacity")
    .eq("event_id", eventId)
    .eq("requires_reservation", true)
    .neq("status", "draft");
  if (filter.conferenceId) conferencesQuery = conferencesQuery.eq("id", filter.conferenceId);

  const [activities, conferences] = await Promise.all([
    only === "conference" ? Promise.resolve({ data: [], error: null }) : activitiesQuery,
    only === "activity" ? Promise.resolve({ data: [], error: null }) : conferencesQuery,
  ]);
  if (activities.error) throw new AppError("UNKNOWN", activities.error.message);
  if (conferences.error) throw new AppError("UNKNOWN", conferences.error.message);

  const sessions: SessionSource[] = [
    ...(activities.data ?? []).map((a) => ({ id: a.id, kind: "activity" as const, name: a.name, starts_at: a.starts_at, ends_at: a.ends_at, location: a.location, capacity: a.capacity })),
    ...(conferences.data ?? []).map((c) => ({ id: c.id, kind: "conference" as const, name: c.title, starts_at: c.starts_at, ends_at: c.ends_at, location: c.location, capacity: c.capacity })),
  ];

  const reservations = await readAll<ReservationSource>((from, to) => {
    let q = admin
      .from("reservations")
      .select(
        "status, reserved_at, activity_id, conference_id, profiles!reservations_profile_id_fkey(full_name, email, phone), tickets(attendee_name, public_code, wristband_delivered_at)",
      )
      .eq("event_id", eventId)
      .in("status", ["confirmed", "waitlisted"])
      .order("id")
      .range(from, to);
    if (filter.activityId) q = q.eq("activity_id", filter.activityId);
    if (filter.conferenceId) q = q.eq("conference_id", filter.conferenceId);
    return q;
  });

  return { sessions, reservations };
}
