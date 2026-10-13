import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, FilterSelect, Pagination, Panel, Pill, TableWrap } from "@/components/admin/ui";
import { ActionForm, Field, SelectField, TextareaField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffPage } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGE_SIZE, pageRange, parsePage, str } from "@/lib/admin/common";
import { createIncidentAction } from "@/app/admin/_actions/operations";
import { CATEGORY_LABEL, PRIORITY, STATUS } from "@/lib/admin/incidents";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Incidencias" };

export default async function IncidentsPage({ searchParams }: PageProps<"/admin/incidencias">) {
  const ctx = await requireStaffPage("incidents.manage", "/admin/incidencias");
  const sp = await searchParams;
  const page = parsePage(sp.pagina);
  const status = str(sp.estado) ?? (sp.estado === undefined ? "abiertas" : undefined);
  const priority = str(sp.prioridad);

  let query = createAdminClient()
    .from("incidents")
    .select("id, title, category, priority, status, created_at, assignee:profiles!incidents_assigned_to_fkey(full_name, email)", { count: "exact" })
    .eq("event_id", ctx.event.id)
    .order("created_at", { ascending: false })
    .range(...pageRange(page));
  if (status === "abiertas") query = query.in("status", ["open", "in_progress"]);
  else if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  const { data, count } = await query;

  return (
    <>
      <AdminHeader title="Incidencias" description="Accesos excepcionales, pagos, boletos, cambios de reserva y duplicados. Cada cambio queda en el historial." />
      <Panel title="Registrar incidencia" className="mb-6">
        <ActionForm action={createIncidentAction} submitLabel="Registrar">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Título" name="title" required className="sm:col-span-2" />
            <SelectField label="Categoría" name="category" options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))} />
            <SelectField label="Prioridad" name="priority" defaultValue="medium" options={Object.entries(PRIORITY).map(([value, v]) => ({ value, label: v.label }))} />
            <Field label="Código de boleto (opcional)" name="ticketCode" placeholder="GL-XXXXX-XXXXX" />
          </div>
          <TextareaField label="Descripción" name="description" rows={3} />
        </ActionForm>
      </Panel>
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="estado" defaultValue={status ?? ""} className="h-10 rounded-lg border border-input bg-card px-3 text-sm" aria-label="Estado">
          <option value="abiertas">Abiertas y en curso</option>
          <option value="">Todas</option>
          {Object.entries(STATUS).map(([v, s]) => (
            <option key={v} value={v}>
              {s.label}
            </option>
          ))}
        </select>
        <FilterSelect name="prioridad" label="Prioridad" value={priority} options={Object.entries(PRIORITY).map(([value, v]) => ({ value, label: v.label }))} />
        <Button type="submit" variant="outline" className="h-10">
          Filtrar
        </Button>
      </form>
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Incidencia</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Creada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Sin incidencias.
                </TableCell>
              </TableRow>
            )}
            {(data ?? []).map((i) => {
              const a = i.assignee as unknown as { full_name: string; email: string } | null;
              return (
                <TableRow key={i.id}>
                  <TableCell>
                    <Link href={`/admin/incidencias/${i.id}`} className="font-medium hover:underline">
                      {i.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[i.category]}</p>
                  </TableCell>
                  <TableCell>
                    <Pill tone={PRIORITY[i.priority].tone}>{PRIORITY[i.priority].label}</Pill>
                  </TableCell>
                  <TableCell>
                    <Pill tone={STATUS[i.status].tone}>{STATUS[i.status].label}</Pill>
                  </TableCell>
                  <TableCell className="text-xs">{a?.full_name || a?.email || "Sin asignar"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(i.created_at)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} params={{ estado: status, prioridad: priority }} />
    </>
  );
}
