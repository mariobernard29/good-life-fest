import type { Metadata } from "next";
import { CalendarClock, Gift, Watch } from "lucide-react";
import { Photo } from "@/components/site/photo";
import { Chips, ImageHero } from "@/components/site/visual";
import { IMG } from "@/content/images";
import { PRE_EVENT, PREMIUM, WELCOME_KIT, WRISTBAND_USES } from "@/content/festival";

export const metadata: Metadata = { title: "Boletos" };

export default function TicketsPage() {
  return (
    <>
      <ImageHero photo={IMG.lakeEntrance} eyebrow="Boletos" title="Lanzamiento de boletos próximamente">
        Capacidad controlada: menos personas, mayor experiencia y mayor valor. Habrá diferentes paquetes y niveles de acceso.
      </ImageHero>

      {/* Cuenta regresiva / pre-evento */}
      <section className="container-page py-20 md:py-28">
        <p className="eyebrow flex items-center gap-2">
          <CalendarClock className="size-4" /> Lo que viene
        </p>
        <h2 className="display mt-3 text-5xl text-balance sm:text-6xl">Antes de abrir la venta</h2>
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {PRE_EVENT.map((s, i) => (
            <li key={s} className={`rounded-2xl border p-4 ${i === PRE_EVENT.length - 1 ? "border-olive bg-olive text-primary-foreground" : "border-border bg-card"}`}>
              <span className="font-mono text-xs opacity-70">{String(i + 1).padStart(2, "0")}</span>
              <p className="display mt-1 text-2xl leading-tight">{s}</p>
            </li>
          ))}
        </ol>
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
        <p className="mt-10 text-muted-foreground">Precios, paquetes y fecha se anunciarán con el lanzamiento oficial.</p>
      </section>
    </>
  );
}
