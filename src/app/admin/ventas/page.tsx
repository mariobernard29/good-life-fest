import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { AdminHeader, CHANNEL_LABEL, FilterSelect, ORDER_STATUS, PAYMENT_LABEL, Pagination, Pill, SearchForm, TableWrap } from "@/components/admin/ui";
import { ConfirmPaymentButton } from "@/components/admin/row-actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffPage } from "@/lib/auth/staff";
import { hasPermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { likePattern, PAGE_SIZE, pageRange, parsePage, str } from "@/lib/admin/common";
import { formatDateTime, formatMoney } from "@/lib/format";
import { SALE_SOURCE_LABEL } from "@/lib/participants/labels";

export const metadata: Metadata = { title: "Ventas y taquilla" };

export default async function SalesPage({ searchParams }: PageProps<"/admin/ventas">) {
  const ctx = await requireStaffPage("orders.view", "/admin/ventas");
  const sp = await searchParams;
  const page = parsePage(sp.pagina);
  const q = str(sp.q);
  const status = str(sp.estado);
  const channel = str(sp.canal);
  const admin = createAdminClient();

  let query = admin
    .from("orders")
    .select("id, reference, buyer_name, buyer_email, total_cents, status, channel, payment_method, sale_source, created_at, paid_at, notes, order_items(quantity, ticket_types(name))", { count: "exact" })
    .eq("event_id", ctx.event.id)
    .order("created_at", { ascending: false })
    .range(...pageRange(page));
  if (status) query = query.eq("status", status);
  if (channel) query = query.eq("channel", channel);
  if (q) query = query.or(`reference.ilike.${likePattern(q)},buyer_email.ilike.${likePattern(q)},buyer_name.ilike.${likePattern(q)}`);
  const { data: orders, count } = await query;

  const canSell = hasPermission(ctx.permissions, "sales.manual");
  const canRegister = hasPermission(ctx.permissions, "participants.register");

  return (
    <>
      <AdminHeader
        title="Ventas y taquilla"
        description="Las entradas se venden en puntos físicos y por mensaje. Cada venta se registra junto con la persona."
        actions={
          canRegister && (
            <Button asChild className="rounded-full">
              <Link href="/admin/asistentes/nuevo">
                <UserPlus /> Registrar participante
              </Link>
            </Button>
          )
        }
      />

      <SearchForm placeholder="Buscar por referencia, correo o nombre" defaultValue={q}>
        <FilterSelect name="estado" label="Estado" value={status} options={Object.entries(ORDER_STATUS).map(([value, v]) => ({ value, label: v.label }))} />
        <FilterSelect name="canal" label="Canal" value={channel} options={Object.entries(CHANNEL_LABEL).map(([value, label]) => ({ value, label }))} />
      </SearchForm>
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Comprador</TableHead>
              <TableHead>Entradas</TableHead>
              <TableHead>Canal / pago</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(orders ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No hay pedidos con estos filtros.
                </TableCell>
              </TableRow>
            )}
            {(orders ?? []).map((o) => {
              const items = o.order_items as unknown as { quantity: number; ticket_types: { name: string } | null }[];
              const st = ORDER_STATUS[o.status] ?? { label: o.status, tone: "gray" as const };
              return (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/admin/asistentes?q=${o.reference}`} className="font-mono text-xs hover:underline">
                      {o.reference}
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{o.buyer_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{o.buyer_email}</p>
                  </TableCell>
                  <TableCell className="text-xs">{items.map((i) => `${i.quantity} × ${i.ticket_types?.name ?? ""}`).join(", ")}</TableCell>
                  <TableCell className="text-xs">
                    {o.sale_source ? SALE_SOURCE_LABEL[o.sale_source] : CHANNEL_LABEL[o.channel]} · {PAYMENT_LABEL[o.payment_method]}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(o.total_cents)}</TableCell>
                  <TableCell>
                    <Pill tone={st.tone}>{st.label}</Pill>
                    {o.notes?.startsWith("PAGO SIMULADO") && (
                      <span className="ml-1">
                        <Pill tone="amber">Simulado</Pill>
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{o.status === "awaiting_payment" && canSell && <ConfirmPaymentButton orderId={o.id} />}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} params={{ q, estado: status, canal: channel }} />
    </>
  );
}
