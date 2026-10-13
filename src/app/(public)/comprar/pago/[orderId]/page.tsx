import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentActions } from "@/components/checkout/payment-actions";
import { requireUserPage } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FEST } from "@/content/festival";
import { formatMoney, formatTime, requestTimeMs } from "@/lib/format";

export const metadata: Metadata = { title: "Pago", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaymentPage({ params }: PageProps<"/comprar/pago/[orderId]">) {
  const { orderId } = await params;
  await requireUserPage(`/comprar/pago/${orderId}`);
  // RLS: el usuario solo puede leer sus propios pedidos.
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, status, total_cents, expires_at, buyer_email, order_items(quantity, unit_price_cents, ticket_types(name))")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) notFound();
  if (order.status === "paid") redirect(`/mi-cuenta/entradas?compra=${order.reference}`);

  const items = order.order_items as unknown as { quantity: number; unit_price_cents: number; ticket_types: { name: string } | null }[];
  const expired = order.status !== "pending" || new Date(order.expires_at).getTime() <= requestTimeMs();

  return (
    <section className="container-page flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-lg">
        <p className="eyebrow">Comprar entradas · Paso 3 de 3</p>
        <h1 className="display mt-3 text-5xl">Pago</h1>

        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">
          <div className="bg-ink px-6 py-4 text-cream">
            <p className="text-xs tracking-[0.25em] text-cream/60 uppercase">{FEST.name}</p>
            <p className="display text-2xl">{FEST.dateLabel}</p>
          </div>
          <div className="space-y-3 p-6">
            <p className="text-xs text-muted-foreground">
              Pedido <span className="font-mono text-foreground">{order.reference}</span> · {order.buyer_email}
            </p>
            <ul className="space-y-2 text-sm">
              {items.map((i, idx) => (
                <li key={idx} className="flex justify-between gap-3">
                  <span>
                    {i.quantity} × {i.ticket_types?.name}
                  </span>
                  <span className="tabular-nums">{formatMoney(i.quantity * i.unit_price_cents)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-2xl font-semibold tabular-nums">{formatMoney(order.total_cents)}</span>
            </div>
          </div>
        </div>

        {expired ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="rounded-xl bg-secondary px-4 py-3 text-sm">
              {order.status === "cancelled" ? "Cancelaste este pedido." : "El apartado venció y las entradas se liberaron."} No se realizó ningún cargo.
            </p>
            <Button asChild className="rounded-full">
              <Link href="/comprar">Elegir entradas de nuevo</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" /> Apartadas hasta las {formatTime(order.expires_at)} h.
            </p>
            <p className="flex items-start gap-2 rounded-xl bg-sunset/15 px-4 py-3 text-sm">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sunset" />
              Modo demostración: este botón simula un pago aprobado. No se pide tarjeta ni se cobra nada.
            </p>
            <PaymentActions orderId={order.id} totalLabel={formatMoney(order.total_cents)} />
          </div>
        )}
      </div>
    </section>
  );
}
