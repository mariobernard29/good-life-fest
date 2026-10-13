import type { Metadata } from "next";
import { Photo } from "@/components/site/photo";
import { Chips, CtaBand, ImageHero, PhotoCard } from "@/components/site/visual";
import { IMG } from "@/content/images";
import { AUDIENCE, AUDIENCE_PROFILE, OBJECTIVES, PILLARS, ZONES } from "@/content/festival";

export const metadata: Metadata = { title: "La experiencia" };

export default function ExperiencePage() {
  return (
    <>
      <ImageHero photo={IMG.yogaBeach} eyebrow="La experiencia" title="Fitness, salud, nutrición, belleza, recuperación y mente.">
        Seis pilares y cuatro zonas para vivir un día completo dedicado a sentirte y vivir mejor.
      </ImageHero>

      {/* Índice de pilares */}
      <nav aria-label="Pilares" className="sticky top-16 z-30 border-b border-border bg-background/90 backdrop-blur">
        <ul className="container-page flex gap-1 overflow-x-auto py-2 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PILLARS.map((p) => (
            <li key={p.slug}>
              <a href={`#${p.slug}`} className="block rounded-full px-3 py-1.5 whitespace-nowrap text-foreground/70 hover:bg-secondary hover:text-foreground">
                {p.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container-page space-y-24 py-20 md:space-y-32 md:py-28">
        {PILLARS.map((p, i) => (
          <section key={p.slug} id={p.slug} className="scroll-mt-32">
            <div className="grid items-end gap-8 md:grid-cols-[1fr_1.2fr]">
              <div className={i % 2 ? "md:order-2" : ""}>
                <p className="font-mono text-sm text-sunset">{p.n}</p>
                <h2 className="display mt-2 text-5xl sm:text-6xl">{p.title}</h2>
                <p className="mt-4 text-xl text-foreground/75">{p.lead}</p>
                <div className="mt-6">
                  <Chips items={p.items} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Photo photo={p.photos[0]} sizes="(min-width: 768px) 30vw, 60vw" className="col-span-2 row-span-2 aspect-[4/5] rounded-3xl" />
                <Photo photo={p.photos[1]} sizes="(min-width: 768px) 15vw, 30vw" className="aspect-square rounded-3xl" />
                <Photo photo={p.photos[2]} sizes="(min-width: 768px) 15vw, 30vw" className="aspect-square rounded-3xl" />
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Zonas */}
      <section className="bg-ink py-20 text-cream md:py-28">
        <div className="container-page">
          <p className="eyebrow text-cream/60">Zonas del festival</p>
          <h2 className="display mt-3 text-5xl sm:text-6xl">Un lugar para cada momento</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {ZONES.map((z) => (
              <PhotoCard key={z.name} photo={z.photo} title={z.name} text={z.text} className="min-h-96" sizes="(min-width: 768px) 50vw, 100vw" />
            ))}
          </div>
        </div>
      </section>

      {/* A quién va dirigido */}
      <section className="container-page grid gap-12 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="eyebrow">¿A quién va dirigido?</p>
          <h2 className="display mt-3 text-5xl text-balance">Para quien decide vivir mejor</h2>
          <p className="mt-4 text-lg text-foreground/75">{AUDIENCE_PROFILE}</p>
          <div className="mt-6">
            <Chips items={AUDIENCE} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Photo photo={IMG.running} sizes="25vw" className="aspect-[3/4] rounded-3xl" />
          <Photo photo={IMG.dance} sizes="25vw" className="mt-10 aspect-[3/4] rounded-3xl" />
        </div>
      </section>

      {/* Objetivos */}
      <section className="container-page">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OBJECTIVES.map((o) => (
            <div key={o.who} className="rounded-3xl border border-border bg-card p-6">
              <p className="eyebrow">{o.who}</p>
              <p className="mt-3 text-foreground/80">{o.text}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaBand title="Descubre tu mejor versión." text="Domingo 17 de enero de 2027 · Lago de los Ávilas." label="Comprar boletos" />
    </>
  );
}
