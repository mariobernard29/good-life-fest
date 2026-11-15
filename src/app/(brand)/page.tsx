import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { Photo } from "@/components/site/photo";
import { Countdown } from "@/components/site/countdown";
import { CtaBand, Figure, PillLink, SectionHead, SectionLabel, TagList, TextLink } from "@/components/site/visual";
import { HeroReel, HoverList, ImageReveal, Parallax, Reveal, SplitText } from "@/components/site/motion";
import { IMG } from "@/content/images";
import { HERO_REEL } from "@/content/videos";
import { ABOUT, BRAND, COMMUNITY, EVENT_FORMATS, HERO, PARTNERS, PILLARS, SHOP, VALUES } from "@/content/brand";
import { FEST } from "@/content/festival";

export const metadata: Metadata = {
  title: { absolute: "Good Life Wellness · Comunidad de bienestar en Los Mochis" },
  description:
    "Good Life Wellness es una comunidad de bienestar en Los Mochis, Sinaloa. Entrenamos juntos, organizamos eventos como el Good Life Wellness Fest y pronto lanzamos nuestra ropa.",
};

export default function BrandHomePage() {
  return (
    <>
      {/* HÉROE */}
      <section className="relative isolate flex min-h-svh items-end overflow-hidden bg-forest text-cream">
        <Photo photo={IMG.pavilionYoga} priority className="absolute inset-0 -z-20" />
        <HeroReel clips={HERO_REEL} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest/95 via-forest/40 to-forest/30" />
        <div className="container-page grid gap-12 pt-40 pb-12 lg:grid-cols-12 lg:items-end lg:pb-16">
          <div className="lg:col-span-8">
            <SectionLabel tone="dark" className="fade-up">
              Good Life Wellness · Los Mochis
            </SectionLabel>
            <SplitText as="h1" text={HERO.title} italic={["compañía."]} delay={150} className="display mt-7 text-6xl text-balance sm:text-8xl lg:text-[7.5rem]" />
            <p className="fade-up mt-8 max-w-xl text-lg leading-relaxed text-cream/80" style={{ "--d": "600ms" } as CSSProperties}>
              {HERO.text}
            </p>
            <div className="fade-up mt-10 flex flex-wrap gap-3" style={{ "--d": "750ms" } as CSSProperties}>
              <PillLink href={BRAND.instagramUrl} variant="light" icon="external">
                Únete en Instagram
              </PillLink>
              <PillLink href="/festival" variant="outline-light">
                Conoce el festival
              </PillLink>
            </div>
          </div>
          <Link
            href="/festival"
            className="fade-up group hidden border-t border-cream/25 pt-5 lg:col-span-3 lg:col-start-10 lg:block"
            style={{ "--d": "900ms" } as CSSProperties}
          >
            <p className="text-xs tracking-[0.18em] text-cream/60 uppercase">Próximo evento</p>
            <p className="display mt-2 text-3xl">Good Life Wellness Fest</p>
            <p className="mt-1 flex items-center justify-between text-sm text-cream/70">
              {FEST.date.replace("Domingo ", "")} · {FEST.venue}
              <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:rotate-45" />
            </p>
          </Link>
        </div>
        <a href="#que-es" aria-label="Bajar" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-cream/60 transition-colors hover:text-cream sm:block">
          <ArrowDown className="size-5 animate-bounce" />
        </a>
      </section>

      {/* QUÉ ES */}
      <section id="que-es" className="py-24 sm:py-32 lg:py-40">
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionLabel n="01">Qué es Good Life Wellness</SectionLabel>
            <SplitText text={ABOUT.title} italic={["convivir."]} className="display mt-7 text-5xl text-balance text-forest sm:text-6xl lg:text-7xl" />
          </div>
          <Reveal className="space-y-5 text-lg leading-relaxed text-foreground/75 lg:col-span-4 lg:col-start-9 lg:pt-16">
            {ABOUT.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>
        </div>

        <div className="container-page mt-20 grid gap-5 lg:mt-28 lg:grid-cols-12">
          <ImageReveal className="aspect-[4/3] lg:col-span-8 lg:aspect-[16/10]">
            <Parallax className="h-full w-full" speed={0.1}>
              <Photo photo={IMG.pavilionYoga} sizes="(min-width: 1024px) 66vw, 100vw" className="h-full w-full" />
            </Parallax>
          </ImageReveal>
          <div className="flex flex-col justify-end gap-5 lg:col-span-4">
            <ImageReveal className="aspect-[4/5]" delay={150}>
              <Photo photo={IMG.friendsSunset} sizes="(min-width: 1024px) 33vw, 100vw" className="h-full w-full" />
            </ImageReveal>
          </div>
        </div>

        <ol className="container-page mt-20 grid gap-10 sm:grid-cols-3 lg:mt-28">
          {VALUES.map((v, i) => (
            <Reveal as="li" key={v.title} delay={i * 120} className="border-t border-forest/20 pt-6">
              <p className="font-mono text-xs text-forest/50">0{i + 1}</p>
              <h3 className="display mt-3 text-3xl text-forest">{v.title}</h3>
              <p className="mt-3 text-foreground/70">{v.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* LO QUE HACEMOS */}
      <section className="bg-secondary/60 py-24 sm:py-32">
        <div className="container-page">
          <SectionHead n="02" label="Lo que hacemos" title="Cuatro formas de vivir la marca." italic={["vivir"]}>
            Empezamos como comunidad y hoy también organizamos eventos y preparamos nuestra propia ropa.
          </SectionHead>
          <div className="mt-16">
            <HoverList items={PILLARS.map((p) => ({ href: p.href, n: p.n, title: p.title, text: p.text, photo: p.photo }))} />
          </div>
        </div>
      </section>

      {/* COMUNIDAD */}
      <section id="comunidad" className="bg-forest py-24 text-cream sm:py-32">
        <div className="container-page grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionLabel n="03" tone="dark">
              Comunidad
            </SectionLabel>
            <SplitText text={COMMUNITY.title} italic={["instagram."]} className="display mt-7 text-5xl text-balance sm:text-6xl" />
            <p className="mt-6 max-w-md text-lg leading-relaxed text-cream/75">{COMMUNITY.text}</p>
            <TagList items={COMMUNITY.perks} tone="dark" columns={1} className="mt-10 max-w-md" />
            <PillLink href={BRAND.instagramUrl} variant="light" icon="external" className="mt-10">
              <InstagramIcon className="size-4" /> Seguir a {BRAND.instagramHandle}
            </PillLink>
          </div>
          <div className="grid grid-cols-2 gap-3 self-center sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            {COMMUNITY.feed.map((p, i) => (
              <a
                key={p.src}
                href={BRAND.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ver más en ${BRAND.instagramHandle}`}
                className={`group relative block ${i % 3 === 1 ? "sm:translate-y-10" : ""}`}
              >
                <ImageReveal className="aspect-[4/5]" delay={i * 90}>
                  <Photo photo={p} sizes="(min-width: 1024px) 16vw, 45vw" className="h-full w-full" imgClassName="duration-[1.4s] group-hover:scale-105" />
                </ImageReveal>
                <span className="absolute inset-0 grid place-items-center bg-forest/0 opacity-0 transition-all duration-500 group-hover:bg-forest/40 group-hover:opacity-100">
                  <InstagramIcon className="size-6" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTOS */}
      <section id="eventos" className="pt-24 sm:pt-32">
        <div className="container-page">
          <SectionHead n="04" label="Eventos" title="Nos vemos en persona." italic={["persona."]} aside={<TextLink href={BRAND.instagramUrl}>Fechas en Instagram</TextLink>}>
            Organizamos encuentros para entrenar, aprender y convivir. Y una vez al año, nuestro festival.
          </SectionHead>
        </div>

        {/* Festival destacado */}
        <div className="relative isolate mt-16 overflow-hidden bg-forest text-cream">
          <Parallax className="absolute inset-0 -z-10" speed={0.16}>
            <Photo photo={IMG.lakeHero} sizes="100vw" className="h-full w-full" />
          </Parallax>
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest via-forest/80 to-forest/30" />
          <div className="container-page grid gap-12 py-24 sm:py-32 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionLabel tone="dark">Evento principal</SectionLabel>
              <Reveal>
                <Image src="/images/logo-wordmark-light.png" alt="Good Life Wellness Fest" width={438} height={109} className="mt-8 h-auto w-72 sm:w-[26rem]" />
              </Reveal>
              <p className="display mt-8 max-w-xl text-3xl text-cream/95 italic sm:text-4xl">{FEST.tagline}</p>
              <p className="mt-5 max-w-lg text-cream/75">
                Un domingo entero de clases, charlas, comida saludable, marcas y música frente al Lago Ávila. {FEST.dateLabel}.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <PillLink href="/festival" variant="light">
                  Ver el festival
                </PillLink>
                <PillLink href="/festival/programa" variant="outline-light">
                  Programa
                </PillLink>
              </div>
            </div>
            <div className="lg:col-span-4 lg:col-start-9">
              <p className="mb-4 text-xs tracking-[0.18em] text-cream/60 uppercase">Faltan</p>
              <Countdown to={FEST.startsAt} />
            </div>
          </div>
        </div>

        {/* Otros formatos */}
        <div className="container-page grid gap-x-6 gap-y-14 py-24 sm:grid-cols-3 sm:py-32">
          {EVENT_FORMATS.map((e, i) => (
            <Figure key={e.title} photo={e.photo} title={e.title} text={e.text} meta={`Formato 0${i + 1} · Próximamente`} sizes="(min-width: 640px) 33vw, 100vw" className={i === 1 ? "sm:mt-16" : ""} />
          ))}
        </div>
      </section>

      {/* SHOP */}
      <section id="shop" className="bg-secondary/60 py-24 sm:py-32">
        <div className="container-page grid gap-14 lg:grid-cols-12 lg:items-center">
          <div className="grid grid-cols-2 gap-4 lg:col-span-6">
            <ImageReveal className="col-span-2 aspect-[4/3] sm:aspect-[16/11]">
              <Parallax className="h-full w-full" speed={0.1}>
                <Photo photo={SHOP.photos[0]} sizes="(min-width: 1024px) 50vw, 100vw" className="h-full w-full" />
              </Parallax>
            </ImageReveal>
            <ImageReveal className="aspect-square" delay={120}>
              <Photo photo={SHOP.photos[1]} sizes="(min-width: 1024px) 25vw, 50vw" className="h-full w-full" />
            </ImageReveal>
            <ImageReveal className="aspect-square" delay={220}>
              <Photo photo={SHOP.photos[2]} sizes="(min-width: 1024px) 25vw, 50vw" className="h-full w-full" />
            </ImageReveal>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <SectionLabel n="05">Ropa y accesorios · Próximamente</SectionLabel>
            <SplitText text={SHOP.title} className="display mt-7 text-5xl text-forest sm:text-7xl" />
            <p className="mt-6 text-lg leading-relaxed text-foreground/75">{SHOP.text}</p>
            <TagList items={SHOP.categories} className="mt-10" />
            <PillLink href={BRAND.instagramUrl} icon="external" className="mt-10">
              Avísame del lanzamiento
            </PillLink>
          </div>
        </div>
      </section>

      {/* ALIANZAS */}
      <div id="alianzas">
        <CtaBand title={PARTNERS.title} text={PARTNERS.text} href={BRAND.instagramUrl} label="Escríbenos por DM" photo={IMG.gymHighFive} />
      </div>
    </>
  );
}
