import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, ShoppingBag } from "lucide-react";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/site/photo";
import { Countdown } from "@/components/site/countdown";
import { Chips, Marquee, PhotoCard } from "@/components/site/visual";
import { HeroReel, LoopVideo, Reveal, SpinBadge } from "@/components/site/motion";
import { IMG } from "@/content/images";
import { HERO_REEL, VID } from "@/content/videos";
import { BRAND, COMMUNITY_FEED, COMMUNITY_PERKS, EVENT_FORMATS, MANIFESTO, SHOP, WHAT_WE_DO } from "@/content/brand";
import { FEST } from "@/content/festival";

export const metadata: Metadata = {
  title: { absolute: "Good Life Wellness · Comunidad, eventos y lifestyle en Los Mochis" },
};

export default function BrandHomePage() {
  return (
    <>
      {/* HERO */}
      <section className="film-grain relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden">
        <Photo photo={IMG.yogaBeach} priority className="absolute inset-0 -z-20" />
        <HeroReel clips={HERO_REEL} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/20" />
        <SpinBadge text="Live the Good Life · Los Mochis · " className="absolute top-8 right-6 hidden text-cream/85 sm:block lg:right-12" />
        <div className="container-page pb-14 text-cream sm:pb-20">
          <p className="eyebrow fade-up text-cream/80">Wellness · Comunidad · Eventos · Apparel</p>
          <h1 className="fade-up mt-6">
            <span className="sr-only">Good Life Wellness</span>
            <Image src="/images/logo-wellness-light.png" alt="" width={439} height={107} priority className="h-auto w-full max-w-[40rem]" />
          </h1>
          <p className="display fade-up mt-8 max-w-2xl text-3xl text-cream/95 italic sm:text-5xl">{BRAND.tagline}</p>
          <p className="fade-up mt-4 max-w-xl text-lg text-cream/80">{BRAND.lead}</p>
          <div className="fade-up mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full bg-cream px-7 text-ink hover:bg-cream/90">
              <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">
                <InstagramIcon className="size-4" /> Únete a la comunidad
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-cream/50 bg-transparent px-7 text-cream hover:bg-cream/10 hover:text-cream">
              <Link href="/festival">
                Good Life Wellness Fest <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Marquee words={BRAND.words} />

      {/* NOSOTROS */}
      <section id="nosotros" className="container-page grid scroll-mt-20 items-center gap-12 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="eyebrow">Sobre Good Life Wellness</p>
          <h2 className="display mt-3 text-5xl text-balance sm:text-6xl">{MANIFESTO.title}</h2>
          <div className="mt-6 space-y-4 text-lg text-foreground/75">
            {MANIFESTO.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
        <Reveal className="grid grid-cols-2 gap-3">
          <Photo photo={IMG.meditation} sizes="(min-width: 768px) 25vw, 50vw" className="aspect-[3/4] rounded-3xl" />
          <Photo photo={IMG.running} sizes="(min-width: 768px) 25vw, 50vw" className="mt-10 aspect-[3/4] rounded-3xl" />
        </Reveal>
      </section>

      {/* QUÉ HACEMOS */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-page">
          <p className="eyebrow">Lo que hacemos</p>
          <h2 className="display mt-3 max-w-3xl text-5xl text-balance sm:text-6xl">Un estilo de vida, cuatro formas de vivirlo.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHAT_WE_DO.map((w, i) => (
              <Reveal key={w.id} delay={i * 100}>
                <a href={w.href} className="block">
                  <PhotoCard photo={w.photo} title={w.title} text={w.text} className="min-h-[26rem]" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMUNIDAD */}
      <section id="comunidad" className="scroll-mt-16 bg-ink py-20 text-cream md:py-28">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[5fr_7fr]">
          <div>
            <p className="eyebrow text-cream/60">Good Life Community</p>
            <h2 className="display mt-3 text-5xl text-balance sm:text-6xl">
              La comunidad <em className="text-sunset">vive</em> en Instagram
            </h2>
            <p className="mt-5 max-w-md text-lg text-cream/80">
              Entrenamientos, recetas, retos, lanzamientos y los anuncios de cada evento. Síguenos y sé parte antes que nadie.
            </p>
            <div className="mt-6">
              <Chips items={COMMUNITY_PERKS} tone="dark" />
            </div>
            <Button asChild size="lg" className="mt-8 h-12 rounded-full bg-cream px-7 text-ink hover:bg-cream/90">
              <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">
                <InstagramIcon className="size-4" /> Seguir a {BRAND.instagramHandle}
              </a>
            </Button>
          </div>
          <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${BRAND.instagramHandle} en Instagram`} className="group grid grid-cols-3 gap-2 sm:gap-3">
            {COMMUNITY_FEED.map((p, i) => (
              <Reveal key={p.src} delay={i * 80} className="relative overflow-hidden rounded-2xl">
                <Photo photo={p} sizes="(min-width: 1024px) 18vw, 33vw" className="aspect-square" imgClassName="group-hover:scale-105" />
              </Reveal>
            ))}
          </a>
        </div>
      </section>

      {/* EVENTOS · FESTIVAL */}
      <section id="eventos" className="container-page scroll-mt-16 py-20 md:py-28">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Eventos Good Life</p>
            <h2 className="display mt-3 text-5xl sm:text-6xl">Bienestar en vivo</h2>
          </div>
          <p className="max-w-sm text-foreground/70">Encuentros para moverte, aprender y conectar. Las fechas se anuncian primero en Instagram.</p>
        </div>

        <Reveal className="mt-10">
          <article className="film-grain relative isolate overflow-hidden rounded-[2rem] text-cream">
            <LoopVideo src={VID.lakeSunset.src} poster={VID.lakeSunset.poster} className="absolute inset-0 -z-10" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/95 via-ink/75 to-ink/30" />
            <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[3fr_2fr] lg:items-end">
              <div>
                <span className="inline-flex rounded-full border border-cream/30 px-3 py-1 font-mono text-[0.65rem] tracking-[0.2em] uppercase backdrop-blur-sm">
                  Evento insignia
                </span>
                <Image src="/images/logo-wordmark-light.png" alt="Good Life Wellness Fest" width={438} height={109} className="mt-6 h-auto w-64 sm:w-80" />
                <p className="display mt-5 max-w-xl text-3xl italic text-cream/95 sm:text-4xl">{FEST.tagline}</p>
                <p className="mt-4 max-w-xl text-cream/80">
                  Un día completo de clases, conferencias, recovery, nutrición, marcas y música frente al Lago Ávila.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream/85">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-sunset" /> {FEST.dateLabel}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4 text-sunset" /> {FEST.venue} · {FEST.city}
                  </span>
                </div>
                <Countdown to={FEST.startsAt} />
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                <Button asChild size="lg" className="h-12 rounded-full bg-cream px-7 text-ink hover:bg-cream/90">
                  <Link href="/festival">
                    Ir al sitio del festival <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-cream/50 bg-transparent px-7 text-cream hover:bg-cream/10 hover:text-cream">
                  <Link href="/festival/programa">Ver programa</Link>
                </Button>
              </div>
            </div>
          </article>
        </Reveal>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {EVENT_FORMATS.map((e, i) => (
            <Reveal key={e.title} delay={i * 100}>
              <article className="overflow-hidden rounded-3xl bg-card">
                <Photo photo={e.photo} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[4/3]" />
                <div className="p-6">
                  <p className="eyebrow">Próximamente</p>
                  <h3 className="display mt-2 text-3xl">{e.title}</h3>
                  <p className="mt-2 text-sm text-foreground/70">{e.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SHOP */}
      <section id="shop" className="scroll-mt-16 bg-secondary/50 py-20 md:py-28">
        <div className="container-page grid items-center gap-12 md:grid-cols-2">
          <Reveal className="grid grid-cols-2 grid-rows-2 gap-3">
            <Photo photo={SHOP.photos[0]} sizes="(min-width: 768px) 25vw, 50vw" className="row-span-2 min-h-96 rounded-3xl" />
            <Photo photo={SHOP.photos[1]} sizes="(min-width: 768px) 25vw, 50vw" className="min-h-44 rounded-3xl" />
            <Photo photo={SHOP.photos[2]} sizes="(min-width: 768px) 25vw, 50vw" className="min-h-44 rounded-3xl" />
          </Reveal>
          <div>
            <p className="eyebrow flex items-center gap-2">
              <ShoppingBag className="size-3.5" /> Ropa y accesorios · Próximamente
            </p>
            <h2 className="display mt-3 text-5xl text-balance sm:text-6xl">{SHOP.title}</h2>
            <p className="mt-5 text-lg text-foreground/75">{SHOP.text}</p>
            <div className="mt-6">
              <Chips items={SHOP.categories} />
            </div>
            <Button asChild size="lg" className="mt-8 h-12 rounded-full px-7">
              <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">
                Entérate del lanzamiento <ArrowUpRight />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ALIANZAS */}
      <section id="alianzas" className="relative isolate scroll-mt-16 overflow-hidden py-24 text-cream">
        <LoopVideo src={VID.crowd.src} poster={VID.crowd.poster} className="absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-ink/75" />
        <div className="container-page text-center">
          <p className="eyebrow text-cream/70">Alianzas</p>
          <h2 className="display mx-auto mt-3 max-w-3xl text-5xl text-balance sm:text-6xl">¿Tu marca comparte la visión de vivir mejor?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-cream/80">
            Colaboraciones de contenido, activaciones, patrocinios en eventos y productos co-creados. Escríbenos por DM y platicamos.
          </p>
          <Button asChild size="lg" className="mt-8 h-12 rounded-full bg-cream px-7 text-ink hover:bg-cream/90">
            <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">
              <InstagramIcon className="size-4" /> Mándanos un DM
            </a>
          </Button>
        </div>
      </section>

      {/* CIERRE */}
      <section className="container-page mt-24">
        <div className="grain flex flex-col items-start gap-6 rounded-[2rem] bg-accent px-8 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-14">
          <div>
            <h2 className="display text-4xl text-balance sm:text-5xl">Live the Good Life.</h2>
            <p className="mt-2 text-foreground/70">Síguenos en {BRAND.instagramHandle} y vive el bienestar todo el año.</p>
          </div>
          <Button asChild size="lg" className="h-12 shrink-0 rounded-full px-7">
            <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">
              <InstagramIcon className="size-4" /> Seguir en Instagram
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
