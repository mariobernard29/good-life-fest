import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/errors";

export const PAGE_SIZE = 25;

export function parsePage(value: unknown): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function pageRange(page: number, size = PAGE_SIZE): [number, number] {
  return [(page - 1) * size, page * size - 1];
}

export function str(value: unknown): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Escapa comodines para filtros ilike de PostgREST. */
export function likePattern(q: string) {
  return `%${q.replace(/[%_,()\\]/g, (c) => `\\${c}`)}%`;
}

/** Registro de auditoría de operaciones administrativas (sin datos sensibles). */
export async function audit(entry: {
  actorId: string;
  eventId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}) {
  const { error } = await createAdminClient()
    .from("audit_logs")
    .insert({
      actor_id: entry.actorId,
      event_id: entry.eventId,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      details: entry.details ?? {},
    });
  if (error) logError("audit", error);
}
