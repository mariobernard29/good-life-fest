import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Gift, ShieldCheck, Watch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/site/photo";
import { Chips, ImageHero } from "@/components/site/visual";
import { IMG } from "@/content/images";
import { FEST, PREMIUM, WELCOME_KIT, WRISTBAND_USES } from "@/content/festival";
import { getCurrentEvent, isEventPublic } from "@/lib/events/current";
import { getTicketAvailability, getTicketTypes } from "@/lib/events/public";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Boletos" };
export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const event = await getCurrentEvent();
  const [types, availability] = isEventPublic(event)
    ? await Promise.all([getTicketTypes(event.id), getTicketAvailability(event.id)])
    : [[], new Map()];
  const onSale = types.filter((t) => t.sale_status === "on_sale");

  return (
    <>
      <ImageHero photo={IMG.lakeEntrance} eyebrow="Boletos" title="Asegura tu lugar">
        {FEST.dateLabel} · {FEST.venue}. Capacidad controlada: menos personas, mayor experiencia y mayor valor.
      </ImageHero>

      <section className="container-page py-20 md:py-28">
        <p className="eyebrow">Elige tu entrada</p>
        <h2 className="display mt-3 text-5xl text-balance sm:text-6xl">Paquetes</h2>
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 text-sunset" /> Venta en modo demostración: el pago es simulado y no se realiza ningún cargo.
        </p>
        {onSale.length === 0 ? (
          <p className="mt-8 text-muted-foreground">Las entradas estarán disponibles muy pronto.</p>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {onSale.map((t, i) => {
              const left = availability.get(t.id)?.available ?? 0;
              const featured = i === onSale.length - 1 && onSale.length > 1;
              return (
                <article key={t.id} className={`flex flex-col rounded-[2rem] p-8 ${featured ? "bg-ink text-cream" : "border border-border bg-card"}`}>
                  <p className={`eyebrow ${featured ? "text-cream/60" : ""}`}>{left > 0 ? (left <= 20 ? `Últimas ${left}` : "Disponible") : "Agotado"}</p>
                  <h3 className="display mt-2 text-4xl">{t.name}</h3>
                  {t.description && <p className={`mt-1 text-sm ${featured ? "text-cream/75" : "text-muted-foreground"}`}>{t.description}</p>}
                  <p className="mt-6 text-4xl font-semibold tabular-nums">{formatMoney(t.price_cents)}</p>
                  <p className={`text-xs ${featured ? "text-cream/60" : "text-muted-foreground"}`}>MXN por persona</p>
                  <ul className="mt-6 space-y-2">
                    {t.benefits.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm">
                        <Check className={`size-4 ${featured ? "text-sunset" : "text-olive"}`} /> {b}
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="lg" disabled={left === 0} className={`mt-8 h-12 rounded-full ${featured ? "bg-cream text-ink hover:bg-cream/90" : ""}`}>
                    <Link href={left > 0 ? `/comprar?tipo=${t.id}` : "#"} aria-disabled={left === 0}>
                      {left > 0 ? "Comprar" : "Agotado"} <ArrowRight />
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>
        )}
        <p className="mt-6 text-sm text-muted-foreground">Para comprar te pediremos crear una cuenta: ahí recibirás tus boletos con código QR.</p>
      </section>

      {/* Welcome kit + pulsera */}
      <section className="container-page grid gap-5 md:grid-cols-2">
        <article className="overflow-hidden rounded-[2rem] border border-border bg-card">
          <Photo photo={IMG.tote} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10]" />
          <div className="p-8">
            <Gift className="size-7 text-olive" />
            <h2 className="display mt-3 text-4xl">Welcome kit</h2>
            <p className="mt-2 text-foreground/75">Según el paquete adquirido, podrá incluir:</p>
            <div className="mt-5">
              <Chips items={WELCOME_KIT} />
            </div>
          </div>
        </article>
        <article className="overflow-hidden rounded-[2rem] bg-ink text-cream">
          <Photo photo={IMG.concert} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10]" />
          <div className="p-8">
            <Watch className="size-7 text-sunset" />
            <h2 className="display mt-3 text-4xl">Pulsera Good Life</h2>
            <p className="mt-2 text-cream/80">El elemento que te identifica durante todo el festival.</p>
            <div className="mt-5">
              <Chips items={WRISTBAND_USES} tone="dark" />
            </div>
          </div>
        </article>
      </section>

      {/* Premium */}
      <section className="container-page py-20 text-center md:py-28">
        <p className="display mx-auto max-w-4xl text-4xl leading-tight text-balance sm:text-5xl">
          {PREMIUM.formula.join(" + ")}
        </p>
        <div className="mx-auto mt-8 max-w-3xl">
          <ul className="flex flex-wrap justify-center gap-2">
            {PREMIUM.benefits.map((b) => (
              <li key={b} className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground/80">
                {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-10 text-muted-foreground">Cada asistente recibe su propio boleto con código QR en su cuenta.</p>
      </section>
    </>
  );
}
