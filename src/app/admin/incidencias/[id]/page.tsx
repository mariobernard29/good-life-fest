import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeader, Panel, Pill } from "@/components/admin/ui";
import { ActionForm, SelectField, TextareaField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { requireStaffPage } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateIncidentAction } from "@/app/admin/_actions/operations";
import { CATEGORY_LABEL, PRIORITY, STATUS } from "@/lib/admin/incidents";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Incidencia" };

export default async function IncidentDetailPage({ params }: PageProps<"/admin/incidencias/[id]">) {
  const ctx = await requireStaffPage("incidents.manage", "/admin/incidencias");
  const { id } = await params;
  const admin = createAdminClient();
  const { data: inc } = await admin
    .from("incidents")
    .select("*, tickets(id, public_code, attendee_name), creator:profiles!incidents_created_by_fkey(full_name, email)")
    .eq("id", id)
    .eq("event_id", ctx.event.id)
    .maybeSingle();
  if (!inc) notFound();
  const [{ data: updates }, { data: staff }] = await Promise.all([
    admin.from("incident_updates").select("id, note, from_status, to_status, changes, created_at, author:profiles(full_name, email)").eq("incident_id", id).order("created_at"),
    admin.from("event_staff").select("user_id, profiles!event_staff_user_id_fkey(full_name, email)").eq("is_active", true).or(`event_id.eq.${ctx.event.id},role.eq.super_admin`),
  ]);
  const ticket = inc.tickets as { id: string; public_code: string; attendee_name: string } | null;
  const creator = inc.creator as { full_name: string; email: string } | null;
  const staffOptions = [
    { value: "", label: "Sin asignar" },
    ...(staff ?? []).map((s) => {
      const p = s.profiles as unknown as { full_name: string; email: string } | null;
      return { value: s.user_id as string, label: p?.full_name || p?.email || s.user_id };
    }),
  ];

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/admin/incidencias">
          <ArrowLeft /> Incidencias
        </Link>
      </Button>
      <AdminHeader
        title={inc.title}
        description={`${CATEGORY_LABEL[inc.category]} · creada ${formatDateTime(inc.created_at)} por ${creator?.full_name || creator?.email || "el sistema"}`}
        actions={
          <>
            <Pill tone={PRIORITY[inc.priority].tone}>{PRIORITY[inc.priority].label}</Pill>
            <Pill tone={STATUS[inc.status].tone}>{STATUS[inc.status].label}</Pill>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Panel title="Descripción">
            <p className="text-sm whitespace-pre-wrap">{inc.description || "Sin descripción."}</p>
            {ticket && (
              <p className="mt-3 text-sm">
                Boleto relacionado:{" "}
                <Link className="font-mono text-olive underline" href={`/admin/asistentes/${ticket.id}`}>
                  {ticket.public_code}
                </Link>{" "}
                · {ticket.attendee_name}
              </p>
            )}
            {inc.resolution && (
              <div className="mt-4 rounded-xl bg-success/10 p-3 text-sm">
                <p className="font-medium text-success">Resolución</p>
                <p className="whitespace-pre-wrap">{inc.resolution}</p>
              </div>
            )}
          </Panel>
          <Panel title="Historial de cambios">
            <ol className="space-y-4 border-l border-border pl-4">
              {(updates ?? []).map((u) => {
                const a = u.author as unknown as { full_name: string; email: string } | null;
                return (
                  <li key={u.id} className="text-sm">
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(u.created_at)} · {a?.full_name || a?.email || "Sistema"}
                    </p>
                    {u.from_status && u.to_status && u.from_status !== u.to_status && (
                      <p>
                        Estado: {STATUS[u.from_status].label} → <strong>{STATUS[u.to_status].label}</strong>
                      </p>
                    )}
                    {u.note && <p className="whitespace-pre-wrap">{u.note}</p>}
                  </li>
                );
              })}
            </ol>
          </Panel>
        </div>
        <Panel title="Actualizar">
          <ActionForm action={updateIncidentAction} submitLabel="Guardar actualización">
            <input type="hidden" name="incidentId" value={inc.id} />
            <SelectField label="Estado" name="status" defaultValue={inc.status} options={Object.entries(STATUS).map(([value, v]) => ({ value, label: v.label }))} />
            <SelectField label="Prioridad" name="priority" defaultValue={inc.priority} options={Object.entries(PRIORITY).map(([value, v]) => ({ value, label: v.label }))} />
            <SelectField label="Responsable" name="assignedTo" defaultValue={inc.assigned_to ?? ""} options={staffOptions} />
            <TextareaField label="Nota" name="note" rows={3} placeholder="Qué se hizo o se acordó" />
            <TextareaField label="Resolución (obligatoria para resolver o cerrar)" name="resolution" rows={3} defaultValue={inc.resolution ?? ""} />
            <p className="text-xs text-muted-foreground">
              Una excepción nunca amplía el cupo automáticamente. Si se autoriza un acceso extraordinario, ajusta el cupo desde la sesión respetando el aforo
              seguro del recinto.
            </p>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
