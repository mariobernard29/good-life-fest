import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Photo } from "@/components/site/photo";
import { PageHero, PillLink, SectionLabel } from "@/components/site/visual";
import { ImageReveal, Reveal } from "@/components/site/motion";
import { IMG } from "@/content/images";
import { FAQS, FEST } from "@/content/festival";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

export default function FaqPage() {
  return (
    <>
      <PageHero photo={IMG.friendsOcean} label="Ayuda" title="Preguntas frecuentes." italic={["frecuentes."]}>
        Lo que más nos preguntan sobre el festival. ¿No encuentras tu duda? Escríbenos.
      </PageHero>

      <div className="container-page grid gap-16 py-24 sm:py-32 lg:grid-cols-12">
        <div className="border-t border-forest/15 lg:col-span-7">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i, 6) * 50}>
              <details className="group border-b border-forest/15">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                  <span className="flex gap-5">
                    <span className="mt-2 font-mono text-xs text-forest/40">{String(i + 1).padStart(2, "0")}</span>
                    <span className="display text-2xl text-forest sm:text-3xl">{f.q}</span>
                  </span>
                  <Plus className="mt-2 size-5 shrink-0 text-forest/60 transition-transform duration-500 group-open:rotate-45" />
                </summary>
                <p className="max-w-2xl pb-8 pl-10 text-lg leading-relaxed text-foreground/70">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
        <aside className="h-fit lg:sticky lg:top-28 lg:col-span-4 lg:col-start-9">
          <ImageReveal className="aspect-[4/3]">
            <Photo photo={IMG.lakeAerial} sizes="(min-width: 1024px) 33vw, 100vw" className="h-full w-full" />
          </ImageReveal>
          <SectionLabel className="mt-8">La sede</SectionLabel>
          <p className="display mt-4 text-4xl text-forest">{FEST.venue}</p>
          <p className="mt-1 text-foreground/70">{FEST.city}</p>
          <p className="mt-4 text-sm text-foreground/70">{FEST.dateLabel}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillLink href={FEST.mapsUrl} icon="external">
              Cómo llegar
            </PillLink>
            <PillLink href={FEST.instagramUrl} variant="outline-dark" icon="external">
              Escríbenos
            </PillLink>
          </div>
        </aside>
      </div>
    </>
  );
}
