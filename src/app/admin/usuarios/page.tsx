import type { Metadata } from "next";
import { AdminHeader, Panel, Pill, TableWrap } from "@/components/admin/ui";
import { ActionForm, CheckboxField, Field, SelectField } from "@/components/forms/fields";
import { StaffActiveToggle } from "@/components/admin/row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffPage } from "@/lib/auth/staff";
import { assignableRoles, ROLE_LABELS, type StaffRole } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { addStaffAction } from "@/app/admin/_actions/operations";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Personal y permisos" };

const ROLE_HELP: Record<StaffRole, string> = {
  super_admin: "Todo, en todos los eventos.",
  event_admin: "Todo el evento: ventas, programa, personal, configuración, anulaciones y cortesías.",
  ticketing_staff: "Taquilla: ventas físicas, asistentes, pulseras, incidencias. Cortesías solo con permiso adicional.",
  checkin_staff: "Solo entrega de pulseras en /pulseras.",
};

export default async function StaffPage() {
  const ctx = await requireStaffPage("staff.manage", "/admin/usuarios");
  const { data } = await createAdminClient()
    .from("event_staff")
    .select("id, role, permissions, is_active, created_at, event_id, user_id, profiles!event_staff_user_id_fkey(full_name, email)")
    .or(`event_id.eq.${ctx.event.id},role.eq.super_admin`)
    .order("created_at");
  const roles = assignableRoles(ctx.roles);

  return (
    <>
      <AdminHeader title="Personal y permisos" description="Los permisos se verifican en el servidor en cada acción. Toda asignación queda auditada." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Panel title="Asignar rol">
          <ActionForm action={addStaffAction} submitLabel="Asignar">
            <Field label="Correo de la persona" name="email" type="email" required hint="Debe tener una cuenta creada en el sitio." />
            <SelectField label="Rol" name="role" defaultValue="checkin_staff" options={roles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
            <CheckboxField label="Puede emitir cortesías" name="issueComplimentary" hint="Permiso adicional para taquilla (los administradores ya lo tienen)." />
          </ActionForm>
          <ul className="mt-6 space-y-2 text-xs text-muted-foreground">
            {(Object.keys(ROLE_HELP) as StaffRole[]).map((r) => (
              <li key={r}>
                <strong className="text-foreground">{ROLE_LABELS[r]}:</strong> {ROLE_HELP[r]}
              </li>
            ))}
          </ul>
        </Panel>
        <TableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((s) => {
                const p = s.profiles as unknown as { full_name: string; email: string } | null;
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <p className="font-medium">{p?.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {p?.email} · desde {formatDateTime(s.created_at)}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {ROLE_LABELS[s.role as StaffRole]}
                      {(s.permissions as string[]).includes("issue_complimentary") && <p className="text-xs text-olive">+ cortesías</p>}
                    </TableCell>
                    <TableCell>
                      <Pill tone={s.is_active ? "green" : "gray"}>{s.is_active ? "Activo" : "Inactivo"}</Pill>
                    </TableCell>
                    <TableCell className="text-right">
                      {s.user_id !== ctx.user.id && roles.includes(s.role as StaffRole) && <StaffActiveToggle staffId={s.id} active={s.is_active} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrap>
      </div>
    </>
  );
}
