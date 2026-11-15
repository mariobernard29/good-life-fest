import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/site/photo";
import { Countdown } from "@/components/site/countdown";
import { Chips, CtaBand, Marquee, Mosaic, PhotoCard } from "@/components/site/visual";
import { HeroReel, LoopVideo, PromoPlayer, Reveal, SpinBadge } from "@/components/site/motion";
import { VenueMap } from "@/components/site/venue-map";
import { IMG } from "@/content/images";
import { DAY_REEL, HERO_REEL, VID } from "@/content/videos";
import { CHALLENGES, COMMUNITY, DIFFERENT, FEST, INTRO, JOURNEY, PILLARS, PREMIUM, VERBS, VISION, ZONES } from "@/content/festival";

export const metadata: Metadata = { title: { absolute: "Good Life Wellness Fest · Lago Ávila, Los Mochis" } };

export default function FestivalHomePage() {
  return (
    <>
      {/* HERO */}
      <section className="film-grain relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden">
        <Photo photo={IMG.lakeHero} priority className="absolute inset-0 -z-20" />
        <HeroReel clips={HERO_REEL} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/35 to-ink/10" />
        <SpinBadge text="Lago Ávila · Los Mochis · 24.01.27 · " className="absolute top-8 right-6 hidden text-cream/85 sm:block lg:right-12" />
        <div className="container-page pb-14 text-cream sm:pb-20">
          <a href={FEST.mapsUrl} target="_blank" rel="noopener noreferrer" className="eyebrow fade-up flex w-fit items-center gap-2 text-cream/80 hover:text-cream">
            <MapPin className="size-3.5" /> {FEST.venue} · {FEST.city}
          </a>
          <h1 className="display word-in mt-6 max-w-3xl text-6xl leading-[0.95] text-balance sm:text-8xl">
            {["Good", "Life", "Wellness", "Fest"].map((w, i) => (
              <span key={w} style={{ animationDelay: `${150 + i * 140}ms` }}>
                {w}&nbsp;
              </span>
            ))}
          </h1>
          <p className="display fade-up mt-6 max-w-2xl text-3xl text-cream/95 italic sm:text-5xl">{FEST.tagline}</p>
          <div className="fade-up mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full bg-cream px-7 text-ink hover:bg-cream/90">
              <Link href="/festival/experiencias">
                Descubre la experiencia <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-cream/50 bg-transparent px-7 text-cream hover:bg-cream/10 hover:text-cream">
              <Link href="/festival/entradas">Boletos · Próximamente</Link>
            </Button>
          </div>
          <p className="mt-8 flex items-center gap-2 text-sm text-cream/75">
            <CalendarDays className="size-4" /> {FEST.dateLabel} · {FEST.arrival}
          </p>
          <Countdown to={FEST.startsAt} />
        </div>
      </section>

      <Marquee />

      {/* QUÉ ES */}
      <section className="container-page grid items-center gap-12 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="eyebrow">¿Qué es Good Life Wellness Fest?</p>
          <h2 className="display mt-3 text-5xl text-balance sm:text-6xl">{INTRO.title}</h2>
          <div className="mt-6 space-y-4 text-lg text-foreground/75">
            {INTRO.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
        <Reveal>
          <Mosaic photos={[IMG.yogaPark, IMG.bowl, IMG.massage]} />
        </Reveal>
      </section>

      {/* UN DÍA EN GOOD LIFE */}
      <section className="bg-ink py-20 text-cream md:py-28">
        <div className="container-page">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-cream/60">{FEST.hours}</p>
              <h2 className="display mt-3 text-5xl sm:text-6xl">
                Un día <em className="text-sunset">entero</em> para ti
              </h2>
            </div>
            <p className="max-w-sm text-cream/70">Del primer saludo al sol hasta la última luz sobre el lago.</p>
          </div>
          <ol className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {DAY_REEL.map((d, i) => (
              <li key={d.title} className={i % 2 ? "lg:mt-16" : ""}>
                <Reveal delay={i * 120} className="group relative isolate aspect-[3/4] overflow-hidden rounded-3xl">
                  <LoopVideo src={d.clip.src} poster={d.clip.poster} className="absolute inset-0 -z-10 transition-transform duration-[1.2s] group-hover:scale-105" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/80 via-transparent to-ink/20" />
                  <div className="flex h-full flex-col justify-between p-5">
                    <span className="w-fit rounded-full border border-cream/30 px-3 py-1 font-mono text-[0.65rem] tracking-[0.2em] uppercase backdrop-blur-sm">
                      {String(i + 1).padStart(2, "0")} · {d.time}
                    </span>
                    <p className="display text-4xl italic sm:text-5xl">{d.title}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* UNA EXPERIENCIA DONDE... */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-page">
          <p className="eyebrow">Una experiencia donde</p>
          <h2 className="display mt-3 max-w-3xl text-5xl text-balance sm:text-6xl">Vives, pruebas y experimentas.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERBS.map((v, i) => (
              <Reveal key={v.title} delay={(i % 3) * 110}>
                <PhotoCard photo={v.photo} title={v.title} text={v.text} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PILARES */}
      <section className="container-page py-20 md:py-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Los pilares</p>
            <h2 className="display mt-3 text-5xl sm:text-6xl">Seis formas de vivir mejor</h2>
          </div>
          <Button asChild variant="link" className="self-start px-0 text-olive">
            <Link href="/festival/experiencias">
              Conoce cada pilar <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {PILLARS.map((p, i) => (
            <Reveal key={p.slug} delay={i * 80}>
              <Link href={`/festival/experiencias#${p.slug}`} className="group">
                <Photo photo={p.photos[0]} sizes="(min-width: 1024px) 16vw, 50vw" className="aspect-[3/4] rounded-2xl" imgClassName="group-hover:scale-105" />
                <p className="mt-3 font-mono text-xs text-muted-foreground">{p.n}</p>
                <p className="display text-2xl leading-tight">{p.title}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* RECORRIDO */}
      <section className="film-grain relative isolate overflow-hidden py-24 text-cream">
        <LoopVideo src={VID.crowd.src} poster={VID.crowd.poster} className="absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-ink/75" />
        <div className="container-page">
          <p className="eyebrow text-cream/70">La experiencia Good Life</p>
          <h2 className="display mt-3 max-w-3xl text-5xl text-balance sm:text-6xl">No compras una entrada. Compras una experiencia.</h2>
          <p className="mt-4 max-w-2xl text-cream/80">Desde que llegas encuentras zonas y actividades que te mantienen involucrado durante todo el día.</p>
          <ol className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {JOURNEY.map((step, i) => (
              <li key={step}>
                <Reveal delay={i * 100} className="h-full rounded-2xl border border-cream/15 bg-cream/5 p-4 backdrop-blur-sm">
                  <span className="font-mono text-xs text-sunset">{String(i + 1).padStart(2, "0")}</span>
                  <p className="display mt-1 text-2xl leading-tight">{step}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ZONAS */}
      <section className="container-page space-y-20 py-20 md:space-y-28 md:py-28">
        {ZONES.map((z, i) => (
          <div key={z.name} className="grid items-center gap-10 md:grid-cols-2">
            <Reveal className={i % 2 ? "md:order-2" : ""}>
              <Photo photo={z.photo} sizes="(min-width: 768px) 50vw, 100vw" className={`aspect-[4/3] rounded-[2rem] ${i % 2 ? "md:rotate-1" : "md:-rotate-1"}`} />
            </Reveal>
            <Reveal delay={120}>
              <p className="eyebrow">{z.kicker}</p>
              <h2 className="display mt-3 text-5xl text-balance">{z.name}</h2>
              <p className="mt-4 text-lg text-foreground/75">{z.text}</p>
              <div className="mt-6">
                <Chips items={z.items} />
              </div>
            </Reveal>
          </div>
        ))}
      </section>

      {/* RETOS + PULSERA */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-page grid gap-5 md:grid-cols-2">
          <article className="overflow-hidden rounded-3xl bg-card">
            <Photo photo={IMG.battleRopes} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3]" />
            <div className="p-6">
              <p className="eyebrow">Retos Good Life</p>
              <h3 className="display mt-2 text-3xl">Compite todo el día</h3>
              <p className="mt-2 text-sm text-foreground/70">Por premios, productos, experiencias y reconocimientos.</p>
              <div className="mt-4">
                <Chips items={CHALLENGES} />
              </div>
            </div>
          </article>
          <article className="overflow-hidden rounded-3xl bg-card">
            <Photo photo={IMG.handsUp} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3]" />
            <div className="p-6">
              <p className="eyebrow">Pulsera Good Life</p>
              <h3 className="display mt-2 text-3xl">Tu llave del festival</h3>
              <p className="mt-2 text-sm text-foreground/70">Te identifica durante todo el día: acceso, control de clases, dinámicas, activaciones, beneficios y concursos.</p>
            </div>
          </article>
        </div>
      </section>

      {/* PROMO */}
      <section className="container-page pt-20 md:pt-28">
        <Reveal className="grid items-end gap-6 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">Mira el promo</p>
            <h2 className="display mt-3 text-5xl text-balance">Así se vive Good Life</h2>
            <p className="mt-4 text-foreground/70">Dale play con sonido.</p>
          </div>
          <PromoPlayer src={VID.promo.src} poster={VID.promo.poster} label="Reproducir video promocional de Good Life Wellness Fest" />
        </Reveal>
      </section>

      {/* PREMIUM */}
      <section className="container-page py-20 text-center md:py-28">
        <p className="eyebrow">Experiencia premium</p>
        <p className="display mx-auto mt-6 max-w-5xl text-4xl leading-tight text-balance sm:text-6xl">
          {PREMIUM.formula.map((f, i) => (
            <span key={f}>
              {i > 0 && <span className="text-sunset"> + </span>}
              {f}
            </span>
          ))}
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/70">
          Capacidad controlada para ofrecer {PREMIUM.benefits.map((b) => b.toLowerCase()).join(", ")}.
        </p>
      </section>

      {/* SEDE */}
      <section className="relative isolate overflow-hidden bg-ink py-20 text-cream md:py-28">
        <LoopVideo src={VID.lakeSunset.src} poster={VID.lakeSunset.poster} className="absolute inset-0 -z-10 opacity-35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="container-page grid items-center gap-10 lg:grid-cols-[5fr_7fr]">
          <Reveal>
            <p className="eyebrow text-cream/60">La sede</p>
            <h2 className="display mt-3 text-5xl sm:text-7xl">{FEST.venue}</h2>
            <p className="mt-5 flex items-center gap-2 text-cream/85">
              <MapPin className="size-4 text-sunset" /> {FEST.city}
            </p>
            <p className="mt-6 max-w-md text-lg text-cream/80">Jardines, palmeras, muelles de madera y un pabellón de cristal frente al agua: el escenario para moverte, descubrir y descansar.</p>
            <Button asChild size="lg" className="mt-8 h-12 rounded-full bg-cream px-7 text-ink hover:bg-cream/90">
              <a href={FEST.mapsUrl} target="_blank" rel="noopener noreferrer">
                Cómo llegar <ArrowRight />
              </a>
            </Button>
            <div className="mt-10 grid max-w-xs grid-cols-2 gap-3">
              <Photo photo={IMG.lakeSunset} sizes="200px" className="aspect-square -rotate-3 rounded-2xl border-4 border-cream" />
              <Photo photo={IMG.lakeNight} sizes="200px" className="mt-6 aspect-square rotate-2 rounded-2xl border-4 border-cream" />
            </div>
          </Reveal>
          <Reveal delay={150} className="h-[28rem] overflow-hidden rounded-[2rem] border border-cream/15 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.8)] sm:h-[34rem]">
            <VenueMap venueLabel={FEST.venue} cityLabel="Centro · Los Mochis" />
          </Reveal>
        </div>
      </section>

      {/* DIFERENTE + COMUNIDAD */}
      <section className="container-page grid gap-12 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="eyebrow">¿Qué hace diferente a Good Life?</p>
          <ul className="mt-6 space-y-2">
            {DIFFERENT.notOnly.map((n) => (
              <li key={n} className="display text-3xl text-foreground/40 line-through decoration-1">
                No es únicamente {n}.
              </li>
            ))}
          </ul>
          <p className="display mt-6 text-4xl text-balance">{DIFFERENT.is}</p>
          <p className="mt-4 text-sm font-medium tracking-wide text-olive uppercase">{DIFFERENT.formula}</p>
        </div>
        <div className="rounded-[2rem] bg-ink p-8 text-cream sm:p-10">
          <p className="eyebrow text-cream/60">Good Life Community</p>
          <h2 className="display mt-3 text-4xl">{COMMUNITY.title}</h2>
          <p className="mt-4 text-cream/80">{COMMUNITY.text}</p>
          <div className="mt-6">
            <Chips items={COMMUNITY.items} tone="dark" />
          </div>
          <blockquote className="display mt-10 border-l-2 border-sunset pl-5 text-2xl text-cream/90 italic">{VISION.motto}</blockquote>
        </div>
      </section>

      <CtaBand title={FEST.closing.join(" ")} text={FEST.dateLabel} label="Boletos · Próximamente" />
    </>
  );
}
