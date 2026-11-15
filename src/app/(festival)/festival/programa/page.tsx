import type { Metadata } from "next";
import { Photo } from "@/components/site/photo";
import { CtaBand, Figure, PageHero, SectionHead, SectionLabel, TagList } from "@/components/site/visual";
import { ImageReveal, Parallax, Reveal } from "@/components/site/motion";
import { IMG } from "@/content/images";
import { CHALLENGE_PRIZES, CHALLENGES, DAY_BLOCKS, FEST, JOURNEY } from "@/content/festival";

export const metadata: Metadata = { title: "Programa" };

const CLASSES = [
  { p: IMG.kettlebell, t: "Hyrox principiantes" },
  { p: IMG.sleds, t: "Hyrox avanzados" },
  { p: IMG.parkYogaGolden, t: "Yoga" },
  { p: IMG.meditateField, t: "Meditación" },
  { p: IMG.stretchPath, t: "Movilidad" },
  { p: IMG.fieldGolden, t: "Funcional" },
  { p: IMG.gymHighFive, t: "CrossFit" },
  { p: IMG.reformer, t: "Y más por anunciar" },
];

export default function ProgramPage() {
  return (
    <>
      <PageHero photo={IMG.parkYogaGolden} label={`Programa · ${FEST.hours}`} title="Un domingo completo de bienestar." italic={["bienestar."]}>
        El día se organiza en cuatro bloques. Algunas clases tendrán dos horarios para que más gente pueda tomarlas. Los horarios exactos se anuncian pronto.
      </PageHero>

      {/* Bloques del día */}
      <section className="container-page py-24 sm:py-32">
        <SectionHead n="01" label="Así va el día" title="Cuatro bloques, de 6:30 a 18:00." />
        <ol className="mt-16 border-t border-forest/15">
          {DAY_BLOCKS.map((b, i) => (
            <li key={b.time} className="grid gap-8 border-b border-forest/15 py-10 lg:grid-cols-12 lg:items-center lg:py-14">
              <Reveal className="lg:col-span-2">
                <p className="display text-7xl text-sunset">0{i + 1}</p>
                <p className="mt-1 text-xs tracking-[0.18em] text-forest/60 uppercase">{b.time}</p>
              </Reveal>
              <Reveal delay={100} className="lg:col-span-4">
                <h2 className="display text-4xl text-forest sm:text-5xl">{b.title}</h2>
                <p className="mt-4 text-lg leading-relaxed text-foreground/70">{b.text}</p>
              </Reveal>
              <ImageReveal className="aspect-[16/10] lg:col-span-5 lg:col-start-8">
                <Parallax className="h-full w-full" speed={0.08}>
                  <Photo photo={b.photo} sizes="(min-width: 1024px) 40vw, 100vw" className="h-full w-full" />
                </Parallax>
              </ImageReveal>
            </li>
          ))}
        </ol>
      </section>

      {/* Clases */}
      <section className="bg-secondary/60 py-24 sm:py-32">
        <div className="container-page">
          <SectionHead n="02" label="Clases" title="Muévete a tu ritmo." italic={["ritmo."]}>
            Todas las clases son para distintos niveles. Las reservas se hacen desde tu cuenta cuando tengas tu entrada.
          </SectionHead>
          <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
            {CLASSES.map((c, i) => (
              <Figure key={c.t} photo={c.p} title={c.t} meta={`0${i + 1}`} aspect="aspect-[3/4]" sizes="(min-width: 1024px) 25vw, 50vw" className={i % 2 ? "lg:mt-12" : ""} />
            ))}
          </div>
        </div>
      </section>

      {/* Retos + recorrido */}
      <section className="container-page grid gap-16 py-24 sm:py-32 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ImageReveal className="aspect-[4/5]">
            <Photo photo={IMG.highFive} sizes="(min-width: 1024px) 40vw, 100vw" className="h-full w-full" />
          </ImageReveal>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 lg:pt-12">
          <SectionLabel n="03">Retos Good Life</SectionLabel>
          <h2 className="display mt-7 text-5xl text-balance text-forest sm:text-6xl">Participa durante todo el día.</h2>
          <TagList items={CHALLENGES} className="mt-10" />
          <p className="mt-10 text-sm font-medium text-forest">Se compite por:</p>
          <TagList items={CHALLENGE_PRIZES} className="mt-4" />

          <p className="mt-16 text-sm font-medium text-forest">Tu recorrido en el festival</p>
          <ol className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-foreground/70">
            {JOURNEY.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                {s}
                {i < JOURNEY.length - 1 && <span className="text-sunset">→</span>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand title="El programa completo, muy pronto." text="Horarios, instructores y clases se publican antes de abrir la venta de boletos." label="Boletos · Próximamente" photo={IMG.fieldGolden} />
    </>
  );
}
