import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeader, CHANNEL_LABEL, ORDER_STATUS, PAYMENT_LABEL, Panel, Pill, TICKET_STATUS } from "@/components/admin/ui";
import { VoidTicketButton } from "@/components/admin/row-actions";
import { Button } from "@/components/ui/button";
import { requireStaffPage } from "@/lib/auth/staff";
import { hasPermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildQrPayload, renderQrSvg } from "@/lib/tickets/qr";
import { formatDateTime, formatMoney } from "@/lib/format";
import { audit } from "@/lib/admin/common";

export const metadata: Metadata = { title: "Detalle de asistente" };

const CHECKIN_LABEL: Record<string, string> = {
  accepted: "Acceso autorizado",
  already_used: "Ya utilizado",
  invalid: "Inválido",
  payment_pending: "Pago pendiente",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  wrong_event: "Otro evento",
  not_allowed: "Zona no incluida",
};

export default async function AttendeeDetailPage({ params }: PageProps<"/admin/asistentes/[id]">) {
  const ctx = await requireStaffPage("attendees.view", "/admin/asistentes");
  const { id } = await params;
  const admin = createAdminClient();
  const { data: t } = await admin
    .from("tickets")
    .select("*, ticket_types(name, access_areas), profiles(email, full_name, phone), order_items(quantity, unit_price_cents, orders(id, reference, buyer_name, buyer_email, buyer_phone, total_cents, status, channel, payment_method, created_at, paid_at, notes))")
    .eq("id", id)
    .eq("event_id", ctx.event.id)
    .maybeSingle();
  if (!t) notFound();

  const [{ data: reservations }, { data: checkins }] = await Promise.all([
    admin
      .from("reservations")
      .select("id, status, reserved_at, cancelled_at, activities(name, starts_at), conferences(title, starts_at)")
      .eq("ticket_id", id)
      .order("reserved_at", { ascending: false }),
    admin.from("check_ins").select("id, result, access_area, method, created_at").eq("ticket_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  const order = (t.order_items as { orders: Record<string, string | number | null> } | null)?.orders;
  const st = TICKET_STATUS[t.status as string];
  const qr = t.status === "valid" ? await renderQrSvg(buildQrPayload(t.qr_token as string)) : null;
  if (qr) {
    // Ver un QR válido es una acción sensible: queda auditada.
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: "ticket.qr_viewed", entity: "ticket", entityId: id });
  }

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/admin/asistentes">
          <ArrowLeft /> Asistentes
        </Link>
      </Button>
      <AdminHeader
        title={(t.attendee_name as string) || "Asistente sin nombre"}
        description={<span className="font-mono">{t.public_code as string}</span>}
        actions={hasPermission(ctx.permissions, "tickets.void") && (t.status === "valid" || t.status === "pending_payment") ? <VoidTicketButton ticketId={id} /> : null}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Boleto">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Estado</dt>
              <dd>{st && <Pill tone={st.tone}>{st.label}</Pill>}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tipo</dt>
              <dd>{(t.ticket_types as { name: string } | null)?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Accesos</dt>
              <dd>{((t.ticket_types as { access_areas: string[] } | null)?.access_areas ?? []).join(", ")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Emitido</dt>
              <dd>{formatDateTime(t.issued_at as string)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Check-in</dt>
              <dd>{t.checked_in_at ? formatDateTime(t.checked_in_at as string) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cuenta</dt>
              <dd className="text-right">{(t.profiles as { email: string } | null)?.email ?? "Sin vincular"}</dd>
            </div>
          </dl>
          {qr && (
            <div className="mt-4">
              <div className="mx-auto w-44 rounded-xl bg-white p-2 ring-1 ring-border [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="mt-2 text-center text-xs text-muted-foreground">Para entregar en taquilla. No compartas este QR con terceros.</p>
            </div>
          )}
        </Panel>
        <Panel title="Pedido">
          {order ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Referencia</dt>
                <dd className="font-mono">{order.reference}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Comprador</dt>
                <dd className="text-right">
                  {order.buyer_name}
                  <br />
                  <span className="text-xs text-muted-foreground">{order.buyer_email}</span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Canal</dt>
                <dd>
                  {CHANNEL_LABEL[order.channel as string]} · {PAYMENT_LABEL[order.payment_method as string]}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pago</dt>
                <dd>
                  <Pill tone={ORDER_STATUS[order.status as string]?.tone}>{ORDER_STATUS[order.status as string]?.label}</Pill>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total</dt>
                <dd>{formatMoney(order.total_cents as number)}</dd>
              </div>
              {order.notes && <p className="rounded-lg bg-secondary/60 p-2 text-xs">{order.notes as string}</p>}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Sin pedido asociado.</p>
          )}
        </Panel>
        <Panel title="Historial de accesos">
          {(checkins ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin intentos de acceso.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {checkins!.map((c) => (
                <li key={c.id} className="flex justify-between gap-2">
                  <span>{CHECKIN_LABEL[c.result] ?? c.result}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Historial de reservas" className="lg:col-span-3">
          {(reservations ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin reservas.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {reservations!.map((r) => {
                const a = r.activities as unknown as { name: string; starts_at: string } | null;
                const c = r.conferences as unknown as { title: string; starts_at: string } | null;
                return (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      {a?.name ?? c?.title} · <span className="text-muted-foreground">{formatDateTime((a ?? c)!.starts_at)}</span>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Pill tone={r.status === "confirmed" ? "green" : r.status === "waitlisted" ? "amber" : "gray"}>
                        {r.status === "confirmed" ? "Confirmada" : r.status === "waitlisted" ? "En espera" : "Cancelada"}
                      </Pill>
                      {formatDateTime(r.reserved_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
