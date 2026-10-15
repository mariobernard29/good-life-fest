import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { AdminHeader, CHANNEL_LABEL, ExportLinks, FilterSelect, ORDER_STATUS, Pagination, Pill, SearchForm, TableWrap, TICKET_STATUS } from "@/components/admin/ui";
import { ResendActivationButton, WristbandToggle } from "@/components/admin/row-actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffPage } from "@/lib/auth/staff";
import { hasPermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGE_SIZE, parsePage, str } from "@/lib/admin/common";
import { searchAttendees } from "@/lib/admin/attendees";
import { formatDateTime } from "@/lib/format";
import { SALE_SOURCE_LABEL } from "@/lib/participants/labels";

export const metadata: Metadata = { title: "Asistentes" };

const INACTIVE = new Set(["cancelled", "refunded"]);

export default async function AttendeesPage({ searchParams }: PageProps<"/admin/asistentes">) {
  const ctx = await requireStaffPage("attendees.view", "/admin/asistentes");
  const sp = await searchParams;
  const filters = {
    q: str(sp.q),
    ticketTypeId: str(sp.tipo),
    status: str(sp.estado),
    payment: str(sp.pago),
    checkin: str(sp.checkin),
    wristband: str(sp.pulsera),
  };
  const page = parsePage(sp.pagina);
  const [{ rows, total }, { data: types }] = await Promise.all([
    searchAttendees(ctx.event.id, { ...filters, page }),
    createAdminClient().from("ticket_types").select("id, name").eq("event_id", ctx.event.id).order("sort_order"),
  ]);
  const canRegister = hasPermission(ctx.permissions, "participants.register");
  const canWristband = hasPermission(ctx.permissions, "wristbands.manage");
  const canExport = hasPermission(ctx.permissions, "exports.download");

  return (
    <>
      <AdminHeader
        title="Asistentes"
        description="Cada fila es una entrada (una persona)."
        actions={
          <>
            {canExport && <ExportLinks href="/admin/exportar/participantes" label="Participantes" />}
            {canRegister && (
              <Button asChild className="rounded-full">
                <Link href="/admin/asistentes/nuevo">
                  <UserPlus /> Registrar participante
                </Link>
              </Button>
            )}
          </>
        }
      />
      <SearchForm placeholder="Nombre, correo, código de boleto (GL-…) o pedido (GLF-…)" defaultValue={filters.q}>
        <FilterSelect name="tipo" label="Tipo" value={filters.ticketTypeId} options={(types ?? []).map((t) => ({ value: t.id, label: t.name }))} />
        <FilterSelect name="estado" label="Boleto" value={filters.status} options={Object.entries(TICKET_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
        <FilterSelect name="pago" label="Pago" value={filters.payment} options={Object.entries(ORDER_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
        <FilterSelect name="pulsera" label="Pulsera" value={filters.wristband} options={[{ value: "entregada", label: "Entregada" }, { value: "pendiente", label: "Pendiente" }]} />
        <FilterSelect name="checkin" label="Check-in" value={filters.checkin} options={[{ value: "si", label: "Ya ingresó" }, { value: "no", label: "No ha ingresado" }]} />
      </SearchForm>
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asistente</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Pedido</TableHead>
              <TableHead>Boleto</TableHead>
              <TableHead>Pulsera</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Check-in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => {
              const order = r.order_items?.orders;
              const st = TICKET_STATUS[r.status];
              const pay = order ? ORDER_STATUS[order.status] : null;
              const active = !INACTIVE.has(r.status);
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/admin/asistentes/${r.id}`} className="font-medium hover:underline">
                      {r.attendee_name || r.profiles?.full_name || "Sin nombre"}
                    </Link>
                    <p className="text-xs text-muted-foreground">{r.profiles?.email ?? r.attendee_email ?? order?.buyer_email ?? "Sin cuenta vinculada"}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.public_code}</TableCell>
                  <TableCell className="text-sm">{r.ticket_types?.name}</TableCell>
                  <TableCell className="text-xs">
                    <span className="font-mono">{order?.reference}</span>
                    <p className="text-muted-foreground">
                      {order ? (order.sale_source ? SALE_SOURCE_LABEL[order.sale_source] : CHANNEL_LABEL[order.channel]) : ""}{" "}
                      {pay && <Pill tone={pay.tone}>{pay.label}</Pill>}
                    </p>
                  </TableCell>
                  <TableCell>{st && <Pill tone={st.tone}>{st.label}</Pill>}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Pill tone={r.wristband_delivered_at ? "green" : "amber"}>{r.wristband_delivered_at ? "Entregada" : "Pendiente"}</Pill>
                      {canWristband && active && <WristbandToggle ticketId={r.id} delivered={Boolean(r.wristband_delivered_at)} compact />}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.profiles ? (
                      r.profiles.activated_at ? (
                        <Pill tone="green">Activada</Pill>
                      ) : (
                        <div className="flex flex-col items-start gap-1">
                          <Pill tone="amber">Sin activar</Pill>
                          {canRegister && <ResendActivationButton profileId={r.profiles.id} />}
                        </div>
                      )
                    ) : (
                      <Pill tone="gray">Sin cuenta</Pill>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.checked_in_at ? formatDateTime(r.checked_in_at) : "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
      <Pagination
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        params={{ q: filters.q, tipo: filters.ticketTypeId, estado: filters.status, pago: filters.payment, checkin: filters.checkin, pulsera: filters.wristband }}
      />
    </>
  );
}
