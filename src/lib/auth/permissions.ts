/**
 * Matriz central de roles y permisos. Es la única fuente de verdad para la
 * autorización en la aplicación (las funciones SQL repiten solo verificaciones
 * gruesas de rol como defensa en profundidad).
 */
export const STAFF_ROLES = ["super_admin", "event_admin", "ticketing_staff", "checkin_staff"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export type Role = StaffRole | "attendee";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Superadministrador",
  event_admin: "Administrador del evento",
  ticketing_staff: "Taquilla",
  checkin_staff: "Entrega de pulseras",
  attendee: "Asistente",
};

export const PERMISSIONS = [
  "dashboard.view",
  "ticket_types.manage",
  "orders.view",
  "sales.manual",
  "sales.complimentary",
  "participants.register",
  "attendees.view",
  "wristbands.manage",
  "tickets.void",
  "sessions.manage",
  "reservations.manage",
  "checkin.perform",
  "checkin.view_log",
  "incidents.manage",
  "content.manage",
  "staff.manage",
  "settings.manage",
  "exports.download",
  "notifications.send",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  event_admin: PERMISSIONS,
  ticketing_staff: [
    "dashboard.view",
    "orders.view",
    "sales.manual",
    "participants.register",
    "attendees.view",
    "wristbands.manage",
    "checkin.perform",
    "checkin.view_log",
    "incidents.manage",
  ],
  checkin_staff: ["checkin.perform", "wristbands.manage"],
};

/** Permisos adicionales asignables individualmente (columna event_staff.permissions). */
export const EXTRA_PERMISSIONS: Record<string, Permission> = {
  issue_complimentary: "sales.complimentary",
};

export type StaffAssignment = { role: StaffRole; permissions: string[] };

export function resolvePermissions(assignments: StaffAssignment[]): Set<Permission> {
  const out = new Set<Permission>();
  for (const a of assignments) {
    ROLE_PERMISSIONS[a.role].forEach((p) => out.add(p));
    for (const extra of a.permissions) {
      const mapped = EXTRA_PERMISSIONS[extra];
      if (mapped) out.add(mapped);
    }
  }
  return out;
}

export function hasPermission(perms: ReadonlySet<Permission>, permission: Permission): boolean {
  return perms.has(permission);
}

/** Roles que un usuario puede asignar a otros. */
export function assignableRoles(actorRoles: StaffRole[]): StaffRole[] {
  if (actorRoles.includes("super_admin")) return [...STAFF_ROLES];
  if (actorRoles.includes("event_admin")) return ["event_admin", "ticketing_staff", "checkin_staff"];
  return [];
}

/** Página de inicio adecuada para cada perfil de personal. */
export function staffHome(perms: ReadonlySet<Permission>): string {
  if (perms.has("dashboard.view")) return "/admin";
  if (perms.has("wristbands.manage")) return "/pulseras";
  return "/mi-cuenta";
}
