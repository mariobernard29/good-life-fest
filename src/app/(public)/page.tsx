import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/site/photo";
import { Countdown } from "@/components/site/countdown";
import { Chips, CtaBand, Marquee, Mosaic, PhotoCard } from "@/components/site/visual";
import { IMG } from "@/content/images";
import { CHALLENGES, COMMUNITY, DIFFERENT, FEST, INTRO, JOURNEY, PILLARS, PREMIUM, VERBS, VISION, WELCOME_KIT, ZONES } from "@/content/festival";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden">
        <Photo photo={IMG.lakeHero} priority className="absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10" />
        <div className="container-page pb-14 text-cream sm:pb-20">
          <a href={FEST.mapsUrl} target="_blank" rel="noopener noreferrer" className="eyebrow fade-up flex w-fit items-center gap-2 text-cream/80 hover:text-cream">
            <MapPin className="size-3.5" /> {FEST.venue} · {FEST.city}
          </a>
          <h1 className="display fade-up mt-6 max-w-3xl text-6xl leading-[0.95] text-balance sm:text-8xl">Good Life Wellness Fest</h1>
          <p className="display fade-up mt-6 max-w-2xl text-3xl text-cream/95 italic sm:text-5xl">{FEST.tagline}</p>
          <div className="fade-up mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full bg-cream px-7 text-ink hover:bg-cream/90">
              <Link href="/experiencias">
                Descubre la experiencia <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-cream/50 bg-transparent px-7 text-cream hover:bg-cream/10 hover:text-cream">
              <Link href="/entradas">Boletos · Próximamente</Link>
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
        <Mosaic photos={[IMG.yogaPark, IMG.bowl, IMG.massage]} />
      </section>

      {/* UNA EXPERIENCIA DONDE... */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-page">
          <p className="eyebrow">Una experiencia donde</p>
          <h2 className="display mt-3 max-w-3xl text-5xl text-balance sm:text-6xl">Vives, pruebas y experimentas.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERBS.map((v) => (
              <PhotoCard key={v.title} photo={v.photo} title={v.title} text={v.text} />
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
            <Link href="/experiencias">
              Conoce cada pilar <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {PILLARS.map((p) => (
            <Link key={p.slug} href={`/experiencias#${p.slug}`} className="group">
              <Photo photo={p.photos[0]} sizes="(min-width: 1024px) 16vw, 50vw" className="aspect-[3/4] rounded-2xl" imgClassName="group-hover:scale-105" />
              <p className="mt-3 font-mono text-xs text-muted-foreground">{p.n}</p>
              <p className="display text-2xl leading-tight">{p.title}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* RECORRIDO */}
      <section className="relative isolate overflow-hidden py-24 text-cream">
        <Photo photo={IMG.crowd} className="absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-ink/80" />
        <div className="container-page">
          <p className="eyebrow text-cream/70">La experiencia Good Life</p>
          <h2 className="display mt-3 max-w-3xl text-5xl text-balance sm:text-6xl">No compras una entrada. Compras una experiencia.</h2>
          <p className="mt-4 max-w-2xl text-cream/80">Desde que llegas encuentras zonas y actividades que te mantienen involucrado durante todo el día.</p>
          <ol className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {JOURNEY.map((step, i) => (
              <li key={step} className="rounded-2xl border border-cream/15 bg-cream/5 p-4 backdrop-blur-sm">
                <span className="font-mono text-xs text-sunset">{String(i + 1).padStart(2, "0")}</span>
                <p className="display mt-1 text-2xl leading-tight">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ZONAS */}
      <section className="container-page space-y-20 py-20 md:space-y-28 md:py-28">
        {ZONES.map((z, i) => (
          <div key={z.name} className="grid items-center gap-10 md:grid-cols-2">
            <Photo photo={z.photo} sizes="(min-width: 768px) 50vw, 100vw" className={`aspect-[4/3] rounded-[2rem] ${i % 2 ? "md:order-2" : ""}`} />
            <div>
              <p className="eyebrow">{z.kicker}</p>
              <h2 className="display mt-3 text-5xl text-balance">{z.name}</h2>
              <p className="mt-4 text-lg text-foreground/75">{z.text}</p>
              <div className="mt-6">
                <Chips items={z.items} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* RETOS + KIT + PULSERA */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-page grid gap-5 lg:grid-cols-3">
          <article className="overflow-hidden rounded-3xl bg-card">
            <Photo photo={IMG.battleRopes} sizes="(min-width: 1024px) 33vw, 100vw" className="aspect-[4/3]" />
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
            <Photo photo={IMG.tote} sizes="(min-width: 1024px) 33vw, 100vw" className="aspect-[4/3]" />
            <div className="p-6">
              <p className="eyebrow">Welcome kit</p>
              <h3 className="display mt-2 text-3xl">Llegas y te recibimos</h3>
              <p className="mt-2 text-sm text-foreground/70">Al llegar, podrá incluir:</p>
              <div className="mt-4">
                <Chips items={WELCOME_KIT} />
              </div>
            </div>
          </article>
          <article className="overflow-hidden rounded-3xl bg-card">
            <Photo photo={IMG.handsUp} sizes="(min-width: 1024px) 33vw, 100vw" className="aspect-[4/3]" />
            <div className="p-6">
              <p className="eyebrow">Pulsera Good Life</p>
              <h3 className="display mt-2 text-3xl">Tu llave del festival</h3>
              <p className="mt-2 text-sm text-foreground/70">Te identifica durante todo el día: acceso, control de clases, dinámicas, activaciones, beneficios y concursos.</p>
            </div>
          </article>
        </div>
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
      <section className="relative isolate overflow-hidden py-28 text-cream">
        <Photo photo={IMG.lakeNight} className="absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-ink/55" />
        <div className="container-page max-w-3xl">
          <p className="eyebrow text-cream/70">La sede</p>
          <h2 className="display mt-3 text-5xl sm:text-6xl">{FEST.venue}</h2>
          <p className="mt-5 flex items-center gap-2 text-cream/85">
            <MapPin className="size-4" /> {FEST.city}
          </p>
          <Button asChild size="lg" className="mt-6 h-12 rounded-full bg-cream px-7 text-ink hover:bg-cream/90">
            <a href={FEST.mapsUrl} target="_blank" rel="noopener noreferrer">
              Cómo llegar <ArrowRight />
            </a>
          </Button>
          <p className="mt-6 max-w-xl text-lg text-cream/80">Jardines, palmeras, muelles de madera y un pabellón de cristal frente al agua: el escenario para moverte, descubrir y descansar.</p>
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
