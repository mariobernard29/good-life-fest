import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, Meter, Panel, StatTile } from "@/components/admin/ui";
import { SalesByDayChart, SoldByTypeChart } from "@/components/admin/charts";
import { requireStaffPage } from "@/lib/auth/staff";
import { getRpc } from "@/lib/db/server-rpc";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

type Stats = {
  capacity: number;
  tickets_issued: number;
  tickets_pending_payment: number;
  tickets_total_inventory: number;
  tickets_held: number;
  checked_in: number;
  revenue_cents: number;
  revenue_online_cents: number;
  revenue_box_office_cents: number;
  orders_pending: number;
  orders_paid: number;
  registered_attendees: number;
  incidents_open: number;
  by_ticket_type: { name: string; sold: number; quantity_total: number }[];
  sales_by_day: { day: string; orders: number; revenue_cents: number }[];
  activities: { id: string; name: string; starts_at: string; capacity: number; confirmed: number; waitlisted: number }[];
  conferences: { id: string; name: string; starts_at: string; capacity: number; confirmed: number; waitlisted: number; requires_reservation: boolean }[];
};

export default async function DashboardPage() {
  const ctx = await requireStaffPage("dashboard.view");
  const activeTickets = () =>
    createAdminClient()
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", ctx.event.id)
      .in("status", ["valid", "checked_in", "pending_payment"]);
  const [s, { count: wristbandsPending }, { count: wristbandsDelivered }] = await Promise.all([
    getRpc().call<Stats>("get_dashboard_stats", { p_event_id: ctx.event.id }),
    activeTickets().is("wristband_delivered_at", null),
    activeTickets().not("wristband_delivered_at", "is", null),
  ]);
  const available = Math.max(Math.min(s.tickets_total_inventory, s.capacity) - s.tickets_issued - s.tickets_pending_payment - s.tickets_held, 0);
  const occupancy = s.capacity ? Math.round((s.tickets_issued / s.capacity) * 100) : 0;
  const reservable = s.conferences.filter((c) => c.requires_reservation);

  return (
    <>
      <AdminHeader title="Dashboard" description={`Actualizado ${formatDateTime(new Date())} · cifras calculadas en la base de datos`} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Entradas vendidas" value={s.tickets_issued} hint={`${available} disponibles · ${s.tickets_held} apartadas`} />
        <StatTile label="Ingresos confirmados" value={formatMoney(s.revenue_cents)} hint={`En línea ${formatMoney(s.revenue_online_cents)} · Taquilla ${formatMoney(s.revenue_box_office_cents)}`} />
        <Link href="/admin/asistentes?pulsera=pendiente" className="contents">
          <StatTile label="Pulseras pendientes" value={wristbandsPending ?? 0} tone={wristbandsPending ? "warning" : undefined} hint="Compras por mensaje · ver lista →" />
        </Link>
        <StatTile label="Asistentes registrados" value={s.registered_attendees} hint="Con cuenta vinculada" />
        <Link href="/admin/asistentes?pulsera=entregada" className="contents">
          <StatTile label="Pulseras entregadas" value={wristbandsDelivered ?? 0} hint="Ver lista →" />
        </Link>
        <StatTile label="Ocupación del festival" value={`${occupancy}%`} hint={`${s.tickets_issued} de ${s.capacity} personas`} />
        <StatTile label="Pago por confirmar (taquilla)" value={s.tickets_pending_payment} tone={s.tickets_pending_payment ? "warning" : undefined} />
        <Link href="/admin/incidencias" className="contents">
          <StatTile label="Incidencias abiertas" value={s.incidents_open} tone={s.incidents_open ? "danger" : undefined} hint="Ver incidencias →" />
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Ingresos confirmados por día">
          <SalesByDayChart data={s.sales_by_day} />
        </Panel>
        <Panel title="Entradas vendidas por tipo">
          <SoldByTypeChart data={s.by_ticket_type} />
        </Panel>
        <Panel title="Ocupación de clases" actions={<Link className="text-xs text-olive hover:underline" href="/admin/actividades">Gestionar</Link>}>
          <div className="space-y-4">
            {s.activities.length === 0 && <p className="text-sm text-muted-foreground">Sin clases publicadas.</p>}
            {s.activities.map((a) => (
              <Meter key={a.id} label={a.name} value={a.confirmed} max={a.capacity} sub={a.waitlisted ? `${a.waitlisted} en lista de espera` : undefined} />
            ))}
          </div>
        </Panel>
        <Panel title="Ocupación de conferencias con reserva" actions={<Link className="text-xs text-olive hover:underline" href="/admin/conferencias">Gestionar</Link>}>
          <div className="space-y-4">
            {reservable.length === 0 && <p className="text-sm text-muted-foreground">Ninguna conferencia requiere reserva.</p>}
            {reservable.map((c) => (
              <Meter key={c.id} label={c.name} value={c.confirmed} max={c.capacity} sub={c.waitlisted ? `${c.waitlisted} en lista de espera` : undefined} />
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
