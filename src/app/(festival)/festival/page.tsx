import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";
import { MapPin } from "lucide-react";
import { Photo } from "@/components/site/photo";
import { Countdown } from "@/components/site/countdown";
import { CtaBand, PillLink, SectionHead, SectionLabel, TagList, TextLink } from "@/components/site/visual";
import { HeroReel, HorizontalScroll, HoverList, ImageReveal, LoopVideo, Parallax, PromoPlayer, Reveal, SplitText } from "@/components/site/motion";
import { VenueMap } from "@/components/site/venue-map";
import { IMG } from "@/content/images";
import { DAY_REEL, HERO_REEL, VID } from "@/content/videos";
import { CHALLENGES, FACTS, FEST, INTRO, PILLARS, VERBS, WRISTBAND_USES, ZONES } from "@/content/festival";

export const metadata: Metadata = { title: { absolute: "Good Life Wellness Fest · Lago Ávila, Los Mochis" } };

export default function FestivalHomePage() {
  return (
    <>
      {/* HÉROE */}
      <section className="relative isolate flex min-h-svh items-end overflow-hidden bg-forest text-cream">
        <Photo photo={IMG.lakeHero} priority className="absolute inset-0 -z-20" />
        <HeroReel clips={HERO_REEL} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest/95 via-forest/35 to-forest/30" />
        <div className="container-page pt-40 pb-12 lg:pb-16">
          <SectionLabel tone="dark" className="fade-up">
            Un evento de Good Life Wellness
          </SectionLabel>
          <h1 className="fade-up mt-8" style={{ "--d": "150ms" } as CSSProperties}>
            <span className="sr-only">Good Life Wellness Fest</span>
            <Image src="/images/logo-wordmark-light.png" alt="" width={438} height={109} priority className="h-auto w-full max-w-[44rem]" />
          </h1>
          <SplitText as="p" text={FEST.tagline} delay={400} className="display mt-8 max-w-3xl text-4xl text-cream/95 italic sm:text-5xl" />
          <div className="mt-12 grid gap-8 border-t border-cream/20 pt-8 lg:grid-cols-12 lg:items-center">
            <dl className="fade-up grid grid-cols-2 gap-6 sm:grid-cols-3 lg:col-span-7" style={{ "--d": "700ms" } as CSSProperties}>
              {FACTS.slice(0, 3).map((f) => (
                <div key={f.label}>
                  <dt className="text-xs tracking-[0.18em] text-cream/55 uppercase">{f.label}</dt>
                  <dd className="display mt-1 text-2xl sm:text-3xl">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="fade-up flex flex-wrap gap-3 lg:col-span-5 lg:justify-end" style={{ "--d": "850ms" } as CSSProperties}>
              <PillLink href="/festival/entradas" variant="light">
                Boletos · Próximamente
              </PillLink>
              <PillLink href="/festival/programa" variant="outline-light">
                Ver programa
              </PillLink>
            </div>
          </div>
        </div>
      </section>

      {/* QUÉ ES */}
      <section className="py-24 sm:py-32 lg:py-40">
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionLabel n="01">El festival</SectionLabel>
            <SplitText text={INTRO.title} italic={["pasarla", "bien."]} className="display mt-7 text-5xl text-balance text-forest sm:text-6xl lg:text-7xl" />
          </div>
          <Reveal className="space-y-5 text-lg leading-relaxed text-foreground/75 lg:col-span-4 lg:col-start-9 lg:pt-16">
            {INTRO.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <TextLink href="/festival/experiencias" className="pt-2">
              Conoce la experiencia
            </TextLink>
          </Reveal>
        </div>

        {/* Verbos */}
        <div className="container-page mt-20 lg:mt-28">
          <ul className="border-t border-forest/15">
            {VERBS.map((v, i) => (
              <Reveal as="li" key={v.title} delay={i * 60} className="grid grid-cols-[3rem_1fr] items-baseline gap-4 border-b border-forest/15 py-5 sm:grid-cols-[5rem_1fr_1fr]">
                <span className="font-mono text-xs text-forest/45">0{i + 1}</span>
                <span className="display text-4xl text-forest sm:text-6xl">{v.title}</span>
                <span className="col-start-2 text-foreground/65 sm:col-start-3">{v.text}</span>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* Datos */}
        <dl className="container-page mt-20 grid grid-cols-2 gap-x-6 gap-y-10 lg:mt-28 lg:grid-cols-4">
          {FACTS.map((f, i) => (
            <Reveal key={f.label} delay={i * 100} className="border-t border-forest/20 pt-5">
              <dt className="text-xs tracking-[0.18em] text-forest/55 uppercase">{f.label}</dt>
              <dd className="display mt-3 text-4xl text-forest sm:text-5xl">{f.value}</dd>
              <dd className="mt-2 text-sm text-foreground/60">{f.note}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* UN DÍA EN GOOD LIFE */}
      <section className="bg-forest text-cream">
        <HorizontalScroll
          className="py-24 lg:py-0"
          header={
            <div className="container-page mb-12 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionLabel n="02" tone="dark">
                  {FEST.hours}
                </SectionLabel>
                <SplitText text="Del amanecer al atardecer." italic={["atardecer."]} className="display mt-6 text-5xl sm:text-7xl" />
              </div>
              <p className="max-w-sm text-cream/70">Así se vive un domingo en el Lago Ávila. Desliza para recorrer el día.</p>
            </div>
          }
        >
          {DAY_REEL.map((d, i) => (
            <article key={d.title} className="relative isolate aspect-[3/4] w-[78vw] shrink-0 snap-start overflow-hidden sm:w-[46vw] lg:h-[62svh] lg:w-auto">
              <LoopVideo src={d.clip.src} poster={d.clip.poster} className="absolute inset-0 -z-10" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest/85 via-transparent to-forest/20" />
              <div className="flex h-full flex-col justify-between p-6">
                <span className="font-mono text-xs tracking-wider text-cream/80">
                  0{i + 1} — {d.time}
                </span>
                <p className="display text-5xl italic sm:text-6xl">{d.title}</p>
              </div>
            </article>
          ))}
          <article className="flex aspect-[3/4] w-[78vw] shrink-0 snap-start flex-col justify-between border border-cream/20 p-8 sm:w-[46vw] lg:h-[62svh] lg:w-auto">
            <span className="font-mono text-xs text-cream/60">05 — Tu día</span>
            <div>
              <p className="display text-5xl">Arma tu propio recorrido.</p>
              <p className="mt-4 text-cream/70">Con tu entrada reservas clases desde tu cuenta y eliges cómo vivir el festival.</p>
              <PillLink href="/festival/programa" variant="light" className="mt-8">
                Ver programa
              </PillLink>
            </div>
          </article>
        </HorizontalScroll>
      </section>

      {/* PILARES */}
      <section className="py-24 sm:py-32">
        <div className="container-page">
          <SectionHead n="03" label="Los pilares" title="Seis formas de sentirte mejor." italic={["sentirte", "mejor."]} aside={<TextLink href="/festival/experiencias">Ver todos los detalles</TextLink>}>
            Cada pilar tiene sus clases, especialistas y marcas. Tú decides por dónde empezar.
          </SectionHead>
          <div className="mt-16">
            <HoverList items={PILLARS.map((p) => ({ href: `/festival/experiencias#${p.slug}`, n: p.n, title: p.title, text: p.lead, photo: p.photos[0] }))} />
          </div>
        </div>
      </section>

      {/* ZONAS */}
      <section className="bg-secondary/60 py-24 sm:py-32">
        <div className="container-page">
          <SectionHead n="04" label="Zonas" title="Un lugar para cada momento." italic={["momento."]} />
        </div>
        <div className="container-page mt-16 space-y-24 lg:mt-24 lg:space-y-36">
          {ZONES.map((z, i) => (
            <article key={z.name} className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <ImageReveal className={`aspect-[4/3] lg:col-span-7 ${i % 2 ? "lg:order-2 lg:col-start-6" : ""}`}>
                <Parallax className="h-full w-full" speed={0.1}>
                  <Photo photo={z.photo} sizes="(min-width: 1024px) 58vw, 100vw" className="h-full w-full" />
                </Parallax>
              </ImageReveal>
              <Reveal className={`lg:col-span-4 ${i % 2 ? "lg:order-1 lg:col-start-1" : "lg:col-start-9"}`}>
                <p className="font-mono text-xs text-forest/50">
                  0{i + 1} · {z.kicker}
                </p>
                <h3 className="display mt-3 text-4xl text-forest sm:text-5xl">{z.name}</h3>
                <p className="mt-5 text-lg leading-relaxed text-foreground/75">{z.text}</p>
                <TagList items={z.items.slice(0, 6)} className="mt-8" />
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      {/* PROMO */}
      <section className="py-24 sm:py-32">
        <div className="container-page grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-4">
            <SectionLabel n="05">El video</SectionLabel>
            <SplitText text="Así se vive Good Life." italic={["good", "life."]} className="display mt-7 text-5xl text-forest sm:text-6xl" />
            <p className="mt-5 text-foreground/70">Dale play con sonido.</p>
          </div>
          <Reveal className="lg:col-span-8">
            <PromoPlayer src={VID.promo.src} poster={VID.promo.poster} label="Reproducir el video de Good Life Wellness Fest" />
          </Reveal>
        </div>
      </section>

      {/* RETOS Y PULSERA */}
      <section className="container-page grid gap-16 pb-24 sm:pb-32 lg:grid-cols-2 lg:gap-10">
        <article>
          <ImageReveal className="aspect-[4/3]">
            <Photo photo={IMG.sleds} sizes="(min-width: 1024px) 50vw, 100vw" className="h-full w-full" />
          </ImageReveal>
          <p className="mt-8 font-mono text-xs text-forest/50">Retos Good Life</p>
          <h3 className="display mt-2 text-4xl text-forest">Compite durante el día</h3>
          <p className="mt-3 text-foreground/70">Retos para todos los niveles, con premios de las marcas participantes.</p>
          <TagList items={CHALLENGES} className="mt-6" />
        </article>
        <article className="lg:mt-24">
          <ImageReveal className="aspect-[4/3]">
            <Photo photo={IMG.festivalCanopy} sizes="(min-width: 1024px) 50vw, 100vw" className="h-full w-full" />
          </ImageReveal>
          <p className="mt-8 font-mono text-xs text-forest/50">Pulsera Good Life</p>
          <h3 className="display mt-2 text-4xl text-forest">Tu llave del festival</h3>
          <p className="mt-3 text-foreground/70">Te la entregamos al llegar. Con ella entras, tomas tus clases y participas en todo.</p>
          <TagList items={WRISTBAND_USES.slice(0, 6)} className="mt-6" />
        </article>
      </section>

      {/* SEDE */}
      <section className="bg-forest py-24 text-cream sm:py-32">
        <div className="container-page grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <SectionLabel n="06" tone="dark">
              La sede
            </SectionLabel>
            <SplitText text={FEST.venue} className="display mt-7 text-6xl sm:text-8xl" />
            <p className="mt-5 flex items-center gap-2 text-cream/80">
              <MapPin className="size-4 text-sunset" /> {FEST.city}
            </p>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-cream/75">Jardines, palmeras, muelles de madera y un pabellón de cristal frente al agua. El lugar ideal para moverte, descubrir y descansar.</p>
            <PillLink href={FEST.mapsUrl} variant="light" icon="external" className="mt-10">
              Cómo llegar
            </PillLink>
            <div className="mt-12 grid max-w-sm grid-cols-2 gap-3">
              <ImageReveal className="aspect-square">
                <Photo photo={IMG.lakeSunset} sizes="200px" className="h-full w-full" />
              </ImageReveal>
              <ImageReveal className="aspect-square" delay={150}>
                <Photo photo={IMG.lakeNight} sizes="200px" className="h-full w-full" />
              </ImageReveal>
            </div>
          </div>
          <Reveal className="h-[28rem] overflow-hidden lg:col-span-7 lg:h-[38rem]">
            <VenueMap venueLabel={FEST.venue} cityLabel="Centro · Los Mochis" />
          </Reveal>
        </div>
        <div className="container-page mt-20 border-t border-cream/15 pt-10">
          <p className="mb-4 text-xs tracking-[0.18em] text-cream/55 uppercase">Faltan</p>
          <Countdown to={FEST.startsAt} />
        </div>
      </section>

      <CtaBand title="Vive la experiencia. Descubre tu mejor versión." italic={["mejor", "versión."]} text={FEST.dateLabel} label="Boletos · Próximamente" photo={IMG.lakeSunset} />
    </>
  );
}
