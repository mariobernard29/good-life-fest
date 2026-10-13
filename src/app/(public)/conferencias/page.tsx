import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Photo } from "@/components/site/photo";
import { Chips, CtaBand, ImageHero } from "@/components/site/visual";
import { IMG } from "@/content/images";
import { PILLARS, ZONES } from "@/content/festival";

export const metadata: Metadata = { title: "Good Life Stage" };

export default function StagePage() {
  const stage = ZONES[0];
  const mind = PILLARS.find((p) => p.slug === "mind")!;
  return (
    <>
      <ImageHero photo={IMG.stage} eyebrow="Escenario principal" title="Good Life Stage">
        {stage.text}
      </ImageHero>

      <section className="container-page grid gap-12 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="eyebrow">En el escenario</p>
          <h2 className="display mt-3 text-5xl text-balance">Ideas, voces y momentos</h2>
          <div className="mt-6">
            <Chips items={stage.items} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Photo photo={IMG.speaker} sizes="25vw" className="aspect-[3/4] rounded-3xl" />
          <Photo photo={IMG.speakerWoman} sizes="25vw" className="mt-10 aspect-[3/4] rounded-3xl" />
        </div>
      </section>

      {/* Speaker principal */}
      <section className="relative isolate overflow-hidden py-28 text-cream">
        <Photo photo={IMG.concert} className="absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-ink/75" />
        <div className="container-page max-w-3xl text-center">
          <Sparkles className="mx-auto size-8 text-sunset" />
          <p className="eyebrow mt-4 text-cream/70">Speaker principal</p>
          <h2 className="display mt-3 text-5xl sm:text-7xl">Por anunciar</h2>
          <p className="mt-5 text-lg text-cream/80">
            Un conferencista o personalidad invitada que generará expectativa y valor adicional para cada participante. Lo revelaremos muy pronto.
          </p>
        </div>
      </section>

      {/* Temas */}
      <section className="container-page grid items-center gap-12 py-20 md:grid-cols-2 md:py-28">
        <Photo photo={IMG.meditation} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3] rounded-[2rem]" />
        <div>
          <p className="eyebrow">Mind & Balance</p>
          <h2 className="display mt-3 text-5xl text-balance">{mind.lead}</h2>
          <div className="mt-6">
            <Chips items={mind.items} />
          </div>
        </div>
      </section>

      <CtaBand title="Pronto revelaremos a nuestros speakers." label="Boletos" />
    </>
  );
}
