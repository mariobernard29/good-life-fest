import type { Metadata } from "next";
import Link from "next/link";
import { LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/site/photo";
import { PurchaseForm, type PurchaseOption } from "@/components/checkout/purchase-form";
import { IMG } from "@/content/images";
import { FEST } from "@/content/festival";
import { getSessionUser } from "@/lib/auth/session";
import { getCurrentEvent, isEventPublic } from "@/lib/events/current";
import { getTicketAvailability, getTicketTypes } from "@/lib/events/public";
import { isDemoPaymentsEnabled } from "@/lib/env";
import { requestTimeMs } from "@/lib/format";

export const metadata: Metadata = { title: "Comprar entradas" };
export const dynamic = "force-dynamic";

export default async function BuyPage({ searchParams }: PageProps<"/comprar">) {
  const { tipo } = await searchParams;
  const preselect = typeof tipo === "string" ? tipo : undefined;
  const next = `/comprar${preselect ? `?tipo=${preselect}` : ""}`;
  const user = await getSessionUser();

  // Paso 1: la compra exige una cuenta.
  if (!user) {
    return (
      <section className="container-page grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="eyebrow">Comprar entradas · Paso 1 de 3</p>
          <h1 className="display mt-3 text-5xl text-balance sm:text-6xl">Crea tu cuenta para comprar</h1>
          <p className="mt-4 text-lg text-foreground/75">
            Tus boletos con código QR quedan guardados en tu cuenta. Desde ahí los presentas en la entrada y reservas tus clases.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-7">
              <Link href={`/registro?next=${encodeURIComponent(next)}`}>
                <UserPlus /> Crear cuenta
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7">
              <Link href={`/login?next=${encodeURIComponent(next)}`}>
                <LogIn /> Ya tengo cuenta
              </Link>
            </Button>
          </div>
          <ol className="mt-10 space-y-2 text-sm text-muted-foreground">
            <li>1. Crea tu cuenta y confirma tu correo.</li>
            <li>2. Elige tus entradas.</li>
            <li>3. Paga y recibe tus boletos con QR en «Mi cuenta».</li>
          </ol>
        </div>
        <Photo photo={IMG.handsUp} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/5] rounded-[2rem]" />
      </section>
    );
  }

  const event = await getCurrentEvent();
  const enabled = isDemoPaymentsEnabled() && isEventPublic(event) && event.settings.online_sales_enabled !== false;
  if (!enabled || !event) {
    return (
      <section className="container-page py-24 text-center">
        <h1 className="display text-5xl">La venta no está disponible</h1>
        <p className="mt-3 text-muted-foreground">Vuelve pronto.</p>
      </section>
    );
  }

  const [types, availability] = await Promise.all([getTicketTypes(event.id), getTicketAvailability(event.id)]);
  const now = requestTimeMs();
  const options: PurchaseOption[] = types
    .filter((t) => t.sale_status === "on_sale")
    .filter((t) => (!t.sales_start_at || new Date(t.sales_start_at).getTime() <= now) && (!t.sales_end_at || new Date(t.sales_end_at).getTime() > now))
    .map((t) => {
      const available = availability.get(t.id)?.available ?? 0;
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        priceCents: t.price_cents,
        benefits: t.benefits,
        maxPerOrder: Math.min(t.max_per_order, available),
        available,
      };
    });

  return (
    <section className="container-page py-12 sm:py-16">
      <p className="eyebrow">Comprar entradas · Paso 2 de 3</p>
      <h1 className="display mt-3 text-5xl sm:text-6xl">Elige tus entradas</h1>
      <p className="mt-3 text-muted-foreground">
        {FEST.dateLabel} · {FEST.venue}. Comprando como <strong className="text-foreground">{user.email}</strong>.
      </p>
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-sunset/15 px-4 py-3 text-sm">
        <ShieldCheck className="size-4 shrink-0 text-sunset" /> Venta en modo demostración: el pago es simulado y no se realiza ningún cargo.
      </p>
      <div className="mt-8">
        {options.length === 0 ? (
          <p className="text-muted-foreground">No hay entradas a la venta en este momento.</p>
        ) : (
          <PurchaseForm options={options} preselect={preselect} />
        )}
      </div>
    </section>
  );
}
