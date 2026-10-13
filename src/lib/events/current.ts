import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEventSlug, isSupabaseConfigured } from "@/lib/env";
import type { EventRow } from "@/lib/types";

/**
 * Evento activo. Se selecciona por EVENT_SLUG; si no está definido, el próximo
 * evento no archivado. Incluye eventos en borrador (las páginas públicas
 * verifican el estado antes de mostrar contenido).
 */
export const getCurrentEvent = cache(async (): Promise<EventRow | null> => {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SECRET_KEY) return null;
  const admin = createAdminClient();
  const slug = getEventSlug();
  const query = admin.from("events").select("*");
  const { data, error } = slug
    ? await query.eq("slug", slug).maybeSingle()
    : await query.neq("status", "archived").order("starts_at", { ascending: true }).limit(1).maybeSingle();
  if (error) {
    console.error("[getCurrentEvent]", error.message);
    return null;
  }
  return (data as EventRow | null) ?? null;
});

export function isEventPublic(event: EventRow | null): event is EventRow {
  return Boolean(event && (event.status === "published" || event.status === "closed"));
}
