import type { Metadata } from "next";
import Link from "next/link";
import { Gift, MapPin, MessageCircle, Watch } from "lucide-react";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/site/photo";
import { Chips, ImageHero } from "@/components/site/visual";
import { IMG } from "@/content/images";
import { FEST, HOW_TO_BUY, TICKET_SALES, WELCOME_KIT, WRISTBAND_USES } from "@/content/festival";

export const metadata: Metadata = { title: "Boletos" };

export default function TicketsPage() {
  const open = FEST.salesOpen;
  const whatsappUrl = TICKET_SALES.whatsapp
    ? `https://wa.me/${TICKET_SALES.whatsapp}?text=${encodeURIComponent(`Hola, quiero comprar mi entrada para ${FEST.name}.`)}`
    : null;

  return (
    <>
      <ImageHero photo={IMG.lakeEntrance} eyebrow="Boletos" title={open ? "Consigue tu entrada" : "Próximamente"}>
        {FEST.dateLabel} · {FEST.venue}, {FEST.city}.
      </ImageHero>

      <section className="container-page py-20 text-center md:py-28">
        <p className="eyebrow">Venta de boletos</p>
        <h2 className="display mx-auto mt-3 max-w-3xl text-5xl text-balance sm:text-6xl">
          {open ? "En puntos de venta y por mensaje." : "Muy pronto te contaremos todos los detalles."}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/75">
          {open
            ? "Escríbenos por WhatsApp o Instagram, o visita uno de nuestros puntos de venta. No hay venta en línea."
            : "La venta será en puntos físicos y por mensaje. Síguenos en Instagram para enterarte en cuanto abramos."}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {open && whatsappUrl && (
            <Button asChild size="lg" className="h-12 rounded-full px-7">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" /> Comprar por WhatsApp
              </a>
            </Button>
          )}
          <Button asChild size="lg" variant={open && whatsappUrl ? "outline" : "default"} className="h-12 rounded-full px-7">
            <a href={FEST.instagramUrl} target="_blank" rel="noopener noreferrer">
              <InstagramIcon className="size-4" /> {open ? "Comprar por DM" : FEST.instagramHandle}
            </a>
          </Button>
        </div>

        {open && TICKET_SALES.points.length > 0 && (
          <div className="mx-auto mt-14 grid max-w-4xl gap-4 text-left sm:grid-cols-2">
            {TICKET_SALES.points.map((p) => (
              <article key={p.name} className="rounded-3xl border border-border bg-card p-6">
                <MapPin className="size-5 text-olive" />
                <h3 className="mt-3 text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-foreground/75">{p.address}</p>
                {p.hours && <p className="mt-1 text-sm text-muted-foreground">{p.hours}</p>}
                {p.mapsUrl && (
                  <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-olive hover:underline">
                    Ver en el mapa
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Cómo funciona */}
      <section className="container-page mb-20">
        <p className="eyebrow text-center">Cómo funciona</p>
        <ol className="mx-auto mt-6 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_TO_BUY.map((step, i) => (
            <li key={step.title} className="rounded-3xl border border-border bg-card p-6">
              <span className="display text-4xl text-olive">{i + 1}</span>
              <h3 className="mt-2 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-foreground/75">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya activaste tu cuenta?{" "}
          <Link href="/login" className="font-medium text-olive hover:underline">
            Entra a Mi cuenta
          </Link>
        </p>
      </section>

      {/* Welcome kit + pulsera */}
      <section className="container-page grid gap-5 md:grid-cols-2">
        <article className="overflow-hidden rounded-[2rem] border border-border bg-card">
          <Photo photo={IMG.tote} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10]" />
          <div className="p-8">
            <Gift className="size-7 text-olive" />
            <h2 className="display mt-3 text-4xl">Welcome kit</h2>
            <p className="mt-2 text-foreground/75">Al llegar, podrá incluir:</p>
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
    </>
  );
}
