import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/events/current";
import { AppError } from "@/lib/errors";
import {
  hasPermission,
  resolvePermissions,
  type Permission,
  type StaffAssignment,
  type StaffRole,
} from "@/lib/auth/permissions";
import type { EventRow } from "@/lib/types";

export type StaffContext = {
  user: SessionUser;
  event: EventRow;
  roles: StaffRole[];
  permissions: Set<Permission>;
};

/** Asignaciones activas del usuario para el evento (incluye super_admin global). */
export const getStaffAssignments = cache(async (userId: string, eventId: string): Promise<StaffAssignment[]> => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("event_staff")
    .select("role, permissions, event_id")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (error) throw new AppError("UNKNOWN", error.message);
  return (data ?? [])
    .filter((row) => row.role === "super_admin" || row.event_id === eventId)
    .map((row) => ({ role: row.role as StaffRole, permissions: (row.permissions as string[]) ?? [] }));
});

export const getStaffContext = cache(async (): Promise<StaffContext | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const event = await getCurrentEvent();
  if (!event) return null;
  const assignments = await getStaffAssignments(user.id, event.id);
  if (assignments.length === 0) return null;
  return {
    user,
    event,
    roles: assignments.map((a) => a.role),
    permissions: resolvePermissions(assignments),
  };
});

/** Para páginas: exige sesión y el permiso indicado. */
export async function requireStaffPage(permission: Permission, next = "/admin"): Promise<StaffContext> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const ctx = await getStaffContext();
  if (!ctx || !hasPermission(ctx.permissions, permission)) redirect("/acceso-denegado");
  return ctx;
}

/** Para Server Actions: lanza AppError si no se cumple el permiso. */
export async function requireStaff(permission: Permission): Promise<StaffContext> {
  const user = await getSessionUser();
  if (!user) throw new AppError("UNAUTHENTICATED");
  const ctx = await getStaffContext();
  if (!ctx || !hasPermission(ctx.permissions, permission)) throw new AppError("FORBIDDEN");
  return ctx;
}
