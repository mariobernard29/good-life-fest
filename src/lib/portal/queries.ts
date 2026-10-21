import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReservationStatus, TicketStatus } from "@/lib/types";

/**
 * Datos del asistente leídos con SU sesión: Row Level Security garantiza que
 * solo obtiene sus propios perfiles, boletos, pedidos y reservas.
 */
export type MyTicket = {
  id: string;
  event_id: string;
  public_code: string;
  attendee_name: string;
  status: TicketStatus;
  issued_at: string;
  checked_in_at: string | null;
  wristband_delivered_at: string | null;
  ticket_types: { name: string; benefits: string[]; access_areas: string[] } | null;
};

export type MyReservation = {
  id: string;
  status: ReservationStatus;
  reserved_at: string;
  ticket_id: string | null;
  activity_id: string | null;
  conference_id: string | null;
  activities: { name: string; starts_at: string; ends_at: string; location: string; instructor: string; cancellation_cutoff_minutes: number; status: string } | null;
  conferences: { title: string; starts_at: string; ends_at: string; location: string; speaker_name: string; cancellation_cutoff_minutes: number; status: string } | null;
};

export const getMyProfile = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("id, full_name, email, phone").eq("id", userId).maybeSingle();
  return data as { id: string; full_name: string; email: string; phone: string | null } | null;
});

export const getMyTickets = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("id, event_id, public_code, attendee_name, status, issued_at, checked_in_at, wristband_delivered_at, ticket_types(name, benefits, access_areas)")
    .order("issued_at", { ascending: true });
  if (error) console.error("[getMyTickets]", error.message);
  return (data ?? []) as unknown as MyTicket[];
});

export const getMyReservations = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id, status, reserved_at, ticket_id, activity_id, conference_id, activities(name, starts_at, ends_at, location, instructor, cancellation_cutoff_minutes, status), conferences(title, starts_at, ends_at, location, speaker_name, cancellation_cutoff_minutes, status)",
    )
    .neq("status", "cancelled")
    .order("reserved_at");
  if (error) console.error("[getMyReservations]", error.message);
  const rows = (data ?? []) as unknown as MyReservation[];
  return rows.sort((a, b) => startOf(a).localeCompare(startOf(b)));
});

export const getMyOrders = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("id, reference, status, total_cents, created_at, channel, order_items(quantity, ticket_types(name))")
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as unknown as {
    id: string;
    reference: string;
    status: string;
    total_cents: number;
    created_at: string;
    channel: string;
    order_items: { quantity: number; ticket_types: { name: string } | null }[];
  }[];
});

export function startOf(r: MyReservation) {
  return r.activities?.starts_at ?? r.conferences?.starts_at ?? "";
}

export function activeTickets(tickets: MyTicket[]) {
  return tickets.filter((t) => t.status === "valid" || t.status === "checked_in");
}
