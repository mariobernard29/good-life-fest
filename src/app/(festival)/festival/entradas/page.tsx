import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { Photo } from "@/components/site/photo";
import { PageHero, PillLink, SectionHead, SectionLabel, TagList } from "@/components/site/visual";
import { ImageReveal, Reveal, SplitText } from "@/components/site/motion";
import { IMG } from "@/content/images";
import { FEST, HOW_TO_BUY, TICKET_SALES, WRISTBAND_USES } from "@/content/festival";

export const metadata: Metadata = { title: "Boletos" };

export default function TicketsPage() {
  const open = FEST.salesOpen;
  const whatsappUrl = TICKET_SALES.whatsapp
    ? `https://wa.me/${TICKET_SALES.whatsapp}?text=${encodeURIComponent(`Hola, quiero comprar mi entrada para ${FEST.name}.`)}`
    : null;

  return (
    <>
      <PageHero photo={IMG.lakeEntrance} label="Boletos" title={open ? "Consigue tu entrada." : "Muy pronto."} italic={["entrada.", "pronto."]}>
        {FEST.dateLabel} · {FEST.venue}, {FEST.city}.
      </PageHero>

      <section className="container-page grid gap-12 py-24 sm:py-32 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionLabel n="01">Venta de boletos</SectionLabel>
          <SplitText
            text={open ? "En puntos de venta y por mensaje." : "Te avisamos en cuanto abra la venta."}
            className="display mt-7 text-5xl text-balance text-forest sm:text-6xl"
          />
        </div>
        <Reveal className="lg:col-span-4 lg:col-start-9 lg:pt-16">
          <p className="text-lg leading-relaxed text-foreground/75">
            {open
              ? "Escríbenos por WhatsApp o Instagram, o visita uno de nuestros puntos de venta. No hay venta en línea."
              : "La venta será en puntos físicos y por mensaje. Síguenos en Instagram para enterarte primero."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {open && whatsappUrl && (
              <PillLink href={whatsappUrl} icon="external">
                Comprar por WhatsApp
              </PillLink>
            )}
            <PillLink href={FEST.instagramUrl} variant={open && whatsappUrl ? "outline-dark" : "dark"} icon="external">
              <InstagramIcon className="size-4" /> {open ? "Comprar por DM" : FEST.instagramHandle}
            </PillLink>
          </div>
        </Reveal>

        {open && TICKET_SALES.points.length > 0 && (
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:col-span-12">
            {TICKET_SALES.points.map((p) => (
              <article key={p.name} className="border-t border-forest/20 pt-6">
                <MapPin className="size-5 text-olive" />
                <h3 className="display mt-3 text-3xl text-forest">{p.name}</h3>
                <p className="mt-2 text-foreground/75">{p.address}</p>
                {p.hours && <p className="mt-1 text-sm text-foreground/55">{p.hours}</p>}
                {p.mapsUrl && (
                  <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" className="link-line mt-3 inline-block text-sm font-semibold text-forest">
                    Ver en el mapa
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Cómo funciona */}
      <section className="bg-secondary/60 py-24 sm:py-32">
        <div className="container-page">
          <SectionHead n="02" label="Cómo funciona" title="Cuatro pasos y listo." italic={["listo."]} />
          <ol className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_TO_BUY.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 110} className="border-t border-forest/20 pt-6">
                <span className="display text-6xl text-sunset">{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold text-forest">{step.title}</h3>
                <p className="mt-2 text-foreground/70">{step.text}</p>
              </Reveal>
            ))}
          </ol>
          <p className="mt-14 text-sm text-foreground/60">
            ¿Ya activaste tu cuenta?{" "}
            <Link href="/login" className="link-line font-semibold text-forest">
              Entra a Mi cuenta
            </Link>
          </p>
        </div>
      </section>

      {/* Pulsera */}
      <section className="container-page grid gap-12 py-24 sm:py-32 lg:grid-cols-12 lg:items-center">
        <ImageReveal className="aspect-[4/3] lg:col-span-6">
          <Photo photo={IMG.festivalCanopy} sizes="(min-width: 1024px) 50vw, 100vw" className="h-full w-full" />
        </ImageReveal>
        <div className="lg:col-span-5 lg:col-start-8">
          <SectionLabel n="03">Pulsera Good Life</SectionLabel>
          <h2 className="display mt-7 text-5xl text-forest sm:text-6xl">Tu llave del festival.</h2>
          <p className="mt-5 text-lg text-foreground/75">Te identifica durante todo el día. Te la entregamos antes del evento o al llegar.</p>
          <TagList items={WRISTBAND_USES} className="mt-10" />
        </div>
      </section>
    </>
  );
}
