import type { Metadata } from "next";
import { Photo } from "@/components/site/photo";
import { CtaBand, PageHero, SectionLabel, TagList } from "@/components/site/visual";
import { ImageReveal, Parallax, Reveal, SplitText } from "@/components/site/motion";
import { IMG } from "@/content/images";
import { PILLARS, ZONES } from "@/content/festival";

export const metadata: Metadata = { title: "Good Life Stage" };

export default function StagePage() {
  const stage = ZONES[0];
  const mind = PILLARS.find((p) => p.slug === "mind")!;
  return (
    <>
      <PageHero photo={IMG.stage} label="Escenario principal" title="Good Life Stage">
        {stage.text}
      </PageHero>

      <section className="container-page grid gap-12 py-24 sm:py-32 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <SectionLabel n="01">En el escenario</SectionLabel>
          <SplitText text="Ideas que te llevas a casa." italic={["casa."]} className="display mt-7 text-5xl text-balance text-forest sm:text-6xl" />
          <p className="mt-6 text-lg leading-relaxed text-foreground/75">Charlas cortas y prácticas con especialistas de salud, nutrición, entrenamiento y mente. Sin tecnicismos.</p>
          <TagList items={stage.items} className="mt-10" />
        </div>
        <ImageReveal className="aspect-[4/5] lg:col-span-6 lg:col-start-7">
          <Parallax className="h-full w-full" speed={0.1}>
            <Photo photo={IMG.talk} sizes="(min-width: 1024px) 50vw, 100vw" className="h-full w-full" />
          </Parallax>
        </ImageReveal>
      </section>

      {/* Speaker principal */}
      <section className="relative isolate overflow-hidden bg-forest py-32 text-cream sm:py-44">
        <Parallax className="absolute inset-0 -z-10" speed={0.2}>
          <Photo photo={IMG.crowdEvent} className="h-full w-full" />
        </Parallax>
        <div className="absolute inset-0 -z-10 bg-forest/80" />
        <div className="container-page text-center">
          <SectionLabel tone="dark" className="justify-center">
            Invitado principal
          </SectionLabel>
          <SplitText text="Por anunciar." italic={["anunciar."]} className="display mt-8 text-7xl sm:text-9xl" />
          <Reveal className="mx-auto mt-8 max-w-xl text-lg text-cream/75">Estamos cerrando a una persona invitada muy especial. La anunciaremos primero en Instagram.</Reveal>
        </div>
      </section>

      {/* Temas */}
      <section className="container-page grid gap-12 py-24 sm:py-32 lg:grid-cols-12 lg:items-center">
        <ImageReveal className="aspect-[4/3] lg:col-span-6">
          <Photo photo={mind.photos[0]} sizes="(min-width: 1024px) 50vw, 100vw" className="h-full w-full" />
        </ImageReveal>
        <div className="lg:col-span-5 lg:col-start-8">
          <SectionLabel n="02">Mind & Balance</SectionLabel>
          <h2 className="display mt-7 text-5xl text-balance text-forest">{mind.lead}</h2>
          <TagList items={mind.items} columns={1} className="mt-10" />
        </div>
      </section>

      <CtaBand title="Pronto revelamos a los speakers." italic={["speakers."]} label="Boletos · Próximamente" photo={IMG.lawnTalk} />
    </>
  );
}
