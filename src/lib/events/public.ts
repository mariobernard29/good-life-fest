import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import { getRpc } from "@/lib/db/server-rpc";
import type {
  ActivityRow,
  AnnouncementRow,
  ConferenceRow,
  ExhibitorRow,
  FaqRow,
  SessionAvailability,
  SponsorRow,
  TicketAvailability,
  TicketTypeRow,
} from "@/lib/types";

/**
 * Lecturas públicas con la llave publicable (sin sesión): RLS garantiza que solo
 * se expone contenido publicado. Los conteos de disponibilidad vienen de funciones
 * del servidor que devuelven únicamente agregados.
 */
function anonClient() {
  const env = getPublicEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getTicketTypes = cache(async (eventId: string) => {
  const { data } = await anonClient()
    .from("ticket_types")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order");
  return (data ?? []) as TicketTypeRow[];
});

export const getTicketAvailability = cache(async (eventId: string) => {
  const rows = await getRpc().call<TicketAvailability[]>("get_ticket_availability", { p_event_id: eventId });
  return new Map(rows.map((r) => [r.ticket_type_id, r]));
});

export const getActivities = cache(async (eventId: string) => {
  const { data } = await anonClient()
    .from("activities")
    .select("*")
    .eq("event_id", eventId)
    .order("starts_at");
  return (data ?? []) as ActivityRow[];
});

export const getConferences = cache(async (eventId: string) => {
  const { data } = await anonClient()
    .from("conferences")
    .select("*")
    .eq("event_id", eventId)
    .order("starts_at");
  return (data ?? []) as ConferenceRow[];
});

export const getSessionAvailability = cache(async (eventId: string) => {
  return getRpc().call<SessionAvailability>("get_session_availability", { p_event_id: eventId });
});

export const getSponsors = cache(async (eventId: string) => {
  const { data } = await anonClient().from("sponsors").select("*").eq("event_id", eventId).order("sort_order");
  return (data ?? []) as SponsorRow[];
});

export const getExhibitors = cache(async (eventId: string) => {
  const { data } = await anonClient().from("exhibitors").select("*").eq("event_id", eventId).order("sort_order");
  return (data ?? []) as ExhibitorRow[];
});

export const getFaqs = cache(async (eventId: string) => {
  const { data } = await anonClient().from("faqs").select("*").eq("event_id", eventId).order("sort_order");
  return (data ?? []) as FaqRow[];
});

export const getAnnouncements = cache(async (eventId: string) => {
  const { data } = await anonClient()
    .from("announcements")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(10);
  return (data ?? []) as AnnouncementRow[];
});

export function seatsLeft(counts: { capacity: number; confirmed: number } | undefined, capacity: number) {
  if (!counts) return capacity;
  return Math.max(capacity - counts.confirmed, 0);
}
