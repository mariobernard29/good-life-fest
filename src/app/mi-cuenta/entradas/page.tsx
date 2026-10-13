import type { Metadata } from "next";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/site/blocks";
import { TicketCard } from "@/components/portal/ticket-card";
import { getCurrentEvent } from "@/lib/events/current";
import { getMyOrders, getMyTickets } from "@/lib/portal/queries";
import { buildQrPayload, renderQrSvg } from "@/lib/tickets/qr";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { requireUserPage } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mis entradas" };

const ORDER_STATUS: Record<string, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  awaiting_payment: "Pago por confirmar",
  failed: "Fallido",
  expired: "Vencido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  partially_refunded: "Reembolso parcial",
};

export default async function MyTicketsPage() {
  const user = await requireUserPage("/mi-cuenta/entradas");
  const [event, tickets, orders] = await Promise.all([getCurrentEvent(), getMyTickets(), getMyOrders()]);
  const dates = event ? `${formatDate(event.starts_at, event.timezone)} – ${formatDate(event.ends_at, event.timezone)}` : "";

  const cards = await Promise.all(
    tickets.map(async (t) => ({
      id: t.id,
      code: t.public_code,
      attendeeName: t.attendee_name,
      typeName: t.ticket_types?.name ?? "Entrada",
      status: t.status,
      // El QR solo se genera en el servidor para boletos válidos del propio usuario.
      qrSvg: t.status === "valid" ? await renderQrSvg(buildQrPayload(t.qr_token)) : null,
      checkedInAt: t.checked_in_at,
      eventName: event?.name ?? "Good Life Wellness Fest",
      eventDates: dates,
    })),
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Mis entradas</p>
        <h1 className="display mt-1 text-4xl sm:text-5xl">Tus boletos</h1>
        <p className="mt-2 text-sm text-muted-foreground">Toca el código QR para mostrarlo en pantalla completa en la entrada.</p>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={<Ticket className="size-5" />}
          title="Aún no tienes entradas"
          action={
            <Button asChild className="rounded-full">
              <Link href="/entradas">Comprar entradas</Link>
            </Button>
          }
        >
          {user.emailConfirmed
            ? `Si compraste con otro correo, crea una cuenta con ese correo para verlas. Correo de esta cuenta: ${user.email}.`
            : "Confirma tu correo electrónico para vincular las compras hechas con él."}
        </EmptyState>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {cards.map((c) => (
            <TicketCard key={c.id} t={c} />
          ))}
        </div>
      )}

      {orders.length > 0 && (
        <section>
          <h2 className="display mb-3 text-3xl">Historial de pedidos</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-sm">{o.reference}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(o.created_at)} · {o.order_items.map((i) => `${i.quantity} × ${i.ticket_types?.name ?? "Entrada"}`).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{ORDER_STATUS[o.status] ?? o.status}</span>
                  <span className="font-medium tabular-nums">{formatMoney(o.total_cents)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
