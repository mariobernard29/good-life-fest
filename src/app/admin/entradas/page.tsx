import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { AdminHeader, Panel, Pill, TableWrap } from "@/components/admin/ui";
import { ActionForm, Field, SelectField, TextareaField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffPage } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRpc } from "@/lib/db/server-rpc";
import { saveTicketTypeAction } from "@/app/admin/_actions/catalog";
import { formatMoney, utcToZonedLocal } from "@/lib/format";
import type { TicketAvailability, TicketTypeRow } from "@/lib/types";

export const metadata: Metadata = { title: "Tipos de entrada" };

const SALE_STATUS = [
  { value: "draft", label: "Borrador (oculto)" },
  { value: "on_sale", label: "En venta (web y taquilla)" },
  { value: "box_office_only", label: "Solo taquilla / cortesías" },
  { value: "paused", label: "Pausado (visible, sin venta)" },
  { value: "closed", label: "Cerrado" },
];
const TONE: Record<string, "green" | "gray" | "amber" | "olive" | "red"> = { draft: "gray", on_sale: "green", box_office_only: "olive", paused: "amber", closed: "red" };

export default async function TicketTypesPage({ searchParams }: PageProps<"/admin/entradas">) {
  const ctx = await requireStaffPage("ticket_types.manage", "/admin/entradas");
  const sp = await searchParams;
  const [{ data }, availability] = await Promise.all([
    createAdminClient().from("ticket_types").select("*").eq("event_id", ctx.event.id).order("sort_order"),
    getRpc().call<TicketAvailability[]>("get_ticket_availability", { p_event_id: ctx.event.id }),
  ]);
  const types = (data ?? []) as TicketTypeRow[];
  const editId = typeof sp.editar === "string" ? sp.editar : undefined;
  const editing = types.find((t) => t.id === editId);
  const showForm = Boolean(editing) || sp.nuevo === "1";
  const tz = ctx.event.timezone;
  const totalInventory = types.reduce((n, t) => n + t.quantity_total, 0);

  return (
    <>
      <AdminHeader
        title="Tipos de entrada"
        description={`Inventario total ${totalInventory} · capacidad del festival ${ctx.event.max_capacity}. La disponibilidad real nunca supera la capacidad general.`}
        actions={
          <Button asChild className="rounded-full">
            <Link href="/admin/entradas?nuevo=1">
              <Plus /> Nuevo tipo
            </Link>
          </Button>
        }
      />
      {sp.guardado === "1" && <p className="mb-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">Cambios guardados.</p>}
      {showForm && (
        <Panel title={editing ? `Editar: ${editing.name}` : "Nuevo tipo de entrada"} className="mb-6">
          <ActionForm action={saveTicketTypeAction} submitLabel={editing ? "Guardar cambios" : "Crear tipo"} resetKey={editing?.id ?? "new"}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Nombre" name="name" defaultValue={editing?.name} required />
              <Field label="Precio (MXN)" name="priceMxn" type="number" step="0.01" min={0} defaultValue={editing ? editing.price_cents / 100 : ""} required />
              <SelectField label="Estado de venta" name="saleStatus" defaultValue={editing?.sale_status ?? "draft"} options={SALE_STATUS} />
              <Field label="Cantidad disponible (inventario)" name="quantityTotal" type="number" min={0} defaultValue={editing?.quantity_total ?? 100} required />
              <Field label="Máximo por compra" name="maxPerOrder" type="number" min={1} max={50} defaultValue={editing?.max_per_order ?? 6} required />
              <Field label="Orden" name="sortOrder" type="number" min={0} defaultValue={editing?.sort_order ?? 0} />
              <Field label="Apertura de venta (opcional)" name="salesStartAt" type="datetime-local" defaultValue={utcToZonedLocal(editing?.sales_start_at, tz)} />
              <Field label="Cierre de venta (opcional)" name="salesEndAt" type="datetime-local" defaultValue={utcToZonedLocal(editing?.sales_end_at, tz)} />
              <Field label="Accesos (separados por coma)" name="accessAreas" defaultValue={(editing?.access_areas ?? ["general"]).join(", ")} hint="Ej. general, vip. Solo informativo." />
            </div>
            <TextareaField label="Descripción" name="description" defaultValue={editing?.description} rows={2} />
            <TextareaField label="Beneficios (uno por línea)" name="benefits" defaultValue={(editing?.benefits ?? []).join("\n")} rows={3} />
          </ActionForm>
        </Panel>
      )}
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Vendidas</TableHead>
              <TableHead className="text-right">Apartadas</TableHead>
              <TableHead className="text-right">Disponibles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((t) => {
              const a = availability.find((x) => x.ticket_type_id === t.id);
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">Accesos: {t.access_areas.join(", ")} · máx. {t.max_per_order} por compra</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(t.price_cents)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a?.issued ?? 0}/{t.quantity_total}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{a?.held ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{a?.available ?? 0}</TableCell>
                  <TableCell>
                    <Pill tone={TONE[t.sale_status]}>{SALE_STATUS.find((s) => s.value === t.sale_status)?.label.split(" (")[0]}</Pill>
                  </TableCell>
                  <TableCell>
                    <Button asChild size="icon-sm" variant="ghost" aria-label="Editar">
                      <Link href={`/admin/entradas?editar=${t.id}`}>
                        <Pencil />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
    </>
  );
}
