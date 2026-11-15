import type { Metadata } from "next";
import { Photo } from "@/components/site/photo";
import { CtaBand, PageHero, SectionHead, SectionLabel, TagList } from "@/components/site/visual";
import { ImageReveal, Parallax, Reveal } from "@/components/site/motion";
import { IMG } from "@/content/images";
import { AUDIENCE, AUDIENCE_PROFILE, PILLARS, ZONES } from "@/content/festival";

export const metadata: Metadata = { title: "La experiencia" };

export default function ExperiencePage() {
  return (
    <>
      <PageHero photo={IMG.pavilionYoga} label="La experiencia" title="Seis pilares, cuatro zonas y un día para ti." italic={["ti."]}>
        Muévete, come rico, descansa, cuídate y conoce gente. Así está organizado el festival.
      </PageHero>

      {/* Índice de pilares */}
      <nav aria-label="Pilares" className="sticky top-0 z-30 border-b border-forest/10 bg-background/90 backdrop-blur-md">
        <ul className="container-page flex gap-6 overflow-x-auto py-4 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PILLARS.map((p) => (
            <li key={p.slug} className="shrink-0">
              <a href={`#${p.slug}`} className="flex items-center gap-2 text-forest/70 hover:text-forest">
                <span className="font-mono text-xs text-forest/40">{p.n}</span>
                <span className="link-line">{p.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container-page space-y-28 py-24 sm:py-32 lg:space-y-40">
        {PILLARS.map((p, i) => (
          <section key={p.slug} id={p.slug} className="scroll-mt-24 grid gap-10 lg:grid-cols-12">
            <Reveal className={`lg:col-span-4 lg:pt-10 ${i % 2 ? "lg:order-2 lg:col-start-9" : ""}`}>
              <p className="font-mono text-xs text-forest/50">{p.n} / 06</p>
              <h2 className="display mt-3 text-5xl text-forest sm:text-6xl">{p.title}</h2>
              <p className="mt-5 text-xl leading-relaxed text-foreground/75">{p.lead}</p>
              <TagList items={p.items} columns={1} className="mt-8" />
            </Reveal>
            <div className={`grid grid-cols-5 gap-4 lg:col-span-7 ${i % 2 ? "lg:order-1" : "lg:col-start-6"}`}>
              <ImageReveal className="col-span-3 row-span-2 aspect-[3/4]">
                <Parallax className="h-full w-full" speed={0.08}>
                  <Photo photo={p.photos[0]} sizes="(min-width: 1024px) 35vw, 60vw" className="h-full w-full" />
                </Parallax>
              </ImageReveal>
              <ImageReveal className="col-span-2 aspect-square" delay={120}>
                <Photo photo={p.photos[1]} sizes="(min-width: 1024px) 20vw, 40vw" className="h-full w-full" />
              </ImageReveal>
              <ImageReveal className="col-span-2 aspect-square self-end" delay={220}>
                <Photo photo={p.photos[2]} sizes="(min-width: 1024px) 20vw, 40vw" className="h-full w-full" />
              </ImageReveal>
            </div>
          </section>
        ))}
      </div>

      {/* Zonas */}
      <section className="bg-forest py-24 text-cream sm:py-32">
        <div className="container-page">
          <SectionHead label="Zonas del festival" title="Dónde pasa cada cosa." italic={["cosa."]} tone="dark" />
          <div className="mt-16 grid gap-x-6 gap-y-16 md:grid-cols-2">
            {ZONES.map((z, i) => (
              <article key={z.name} className={i % 2 ? "md:mt-24" : ""}>
                <ImageReveal className="aspect-[4/3]">
                  <Photo photo={z.photo} sizes="(min-width: 768px) 50vw, 100vw" className="h-full w-full" />
                </ImageReveal>
                <p className="mt-6 font-mono text-xs text-cream/50">{z.kicker}</p>
                <h3 className="display mt-2 text-4xl">{z.name}</h3>
                <p className="mt-3 max-w-md text-cream/75">{z.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Para quién */}
      <section className="container-page grid gap-12 py-24 sm:py-32 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionLabel>¿Para quién es?</SectionLabel>
          <h2 className="display mt-7 text-5xl text-balance text-forest sm:text-6xl">Para cualquiera que quiera sentirse mejor.</h2>
          <p className="mt-6 text-lg leading-relaxed text-foreground/75">{AUDIENCE_PROFILE}</p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <p className="mb-5 text-sm text-foreground/60">Si te interesa alguno de estos temas, este festival es para ti:</p>
          <TagList items={AUDIENCE} />
        </div>
      </section>

      <CtaBand title="Descubre tu mejor versión." italic={["mejor", "versión."]} text="Domingo 24 de enero de 2027 · Lago Ávila." label="Boletos · Próximamente" photo={IMG.parkYogaGolden} />
    </>
  );
}
