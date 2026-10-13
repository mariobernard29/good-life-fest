import type { Metadata } from "next";
import { Photo } from "@/components/site/photo";
import { ImageHero } from "@/components/site/visual";
import { IMG } from "@/content/images";
import { FAQS, FEST } from "@/content/festival";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

export default function FaqPage() {
  return (
    <>
      <ImageHero photo={IMG.fruits} eyebrow="Ayuda" title="Preguntas frecuentes" />
      <div className="container-page grid gap-10 py-20 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 open:bg-secondary/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                {f.q}
                <span className="text-2xl leading-none text-olive transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-foreground/75">{f.a}</p>
            </details>
          ))}
        </div>
        <aside className="h-fit overflow-hidden rounded-[2rem] bg-ink text-cream">
          <Photo photo={IMG.lakeAerial} sizes="(min-width: 1024px) 33vw, 100vw" className="aspect-[4/3]" />
          <div className="p-6">
            <p className="eyebrow text-cream/60">La sede</p>
            <p className="display mt-2 text-3xl">{FEST.venue}</p>
            <p className="mt-1 text-sm text-cream/75">{FEST.city}</p>
            <p className="mt-4 text-sm text-cream/75">{FEST.dateLabel}. Muy pronto compartiremos el save the date.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
