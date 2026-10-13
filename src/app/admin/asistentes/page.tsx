import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, CHANNEL_LABEL, FilterSelect, ORDER_STATUS, Pagination, Pill, SearchForm, TableWrap, TICKET_STATUS } from "@/components/admin/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffPage } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGE_SIZE, parsePage, str } from "@/lib/admin/common";
import { searchAttendees } from "@/lib/admin/attendees";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Asistentes" };

export default async function AttendeesPage({ searchParams }: PageProps<"/admin/asistentes">) {
  const ctx = await requireStaffPage("attendees.view", "/admin/asistentes");
  const sp = await searchParams;
  const filters = { q: str(sp.q), ticketTypeId: str(sp.tipo), status: str(sp.estado), payment: str(sp.pago), checkin: str(sp.checkin) };
  const page = parsePage(sp.pagina);
  const [{ rows, total }, { data: types }] = await Promise.all([
    searchAttendees(ctx.event.id, { ...filters, page }),
    createAdminClient().from("ticket_types").select("id, name").eq("event_id", ctx.event.id).order("sort_order"),
  ]);

  return (
    <>
      <AdminHeader title="Asistentes" description="Cada fila es un boleto individual." />
      <SearchForm placeholder="Nombre, correo, código de boleto (GL-…) o pedido (GLF-…)" defaultValue={filters.q}>
        <FilterSelect name="tipo" label="Tipo" value={filters.ticketTypeId} options={(types ?? []).map((t) => ({ value: t.id, label: t.name }))} />
        <FilterSelect name="estado" label="Boleto" value={filters.status} options={Object.entries(TICKET_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
        <FilterSelect name="pago" label="Pago" value={filters.payment} options={Object.entries(ORDER_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
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
              <TableHead>Check-in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => {
              const order = r.order_items?.orders;
              const st = TICKET_STATUS[r.status];
              const pay = order ? ORDER_STATUS[order.status] : null;
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/admin/asistentes/${r.id}`} className="font-medium hover:underline">
                      {r.attendee_name || "Sin nombre"}
                    </Link>
                    <p className="text-xs text-muted-foreground">{r.profiles?.email ?? r.attendee_email ?? order?.buyer_email ?? "Sin cuenta vinculada"}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.public_code}</TableCell>
                  <TableCell className="text-sm">{r.ticket_types?.name}</TableCell>
                  <TableCell className="text-xs">
                    <span className="font-mono">{order?.reference}</span>
                    <p className="text-muted-foreground">
                      {order ? CHANNEL_LABEL[order.channel] : ""} {pay && <Pill tone={pay.tone}>{pay.label}</Pill>}
                    </p>
                  </TableCell>
                  <TableCell>{st && <Pill tone={st.tone}>{st.label}</Pill>}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.checked_in_at ? formatDateTime(r.checked_in_at) : "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} params={{ q: filters.q, tipo: filters.ticketTypeId, estado: filters.status, pago: filters.payment, checkin: filters.checkin }} />
    </>
  );
}
