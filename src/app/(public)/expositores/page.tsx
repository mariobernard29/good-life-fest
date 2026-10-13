import type { Metadata } from "next";
import { Check, Megaphone, Store } from "lucide-react";
import { Photo } from "@/components/site/photo";
import { Chips, CtaBand, ImageHero, PhotoCard } from "@/components/site/visual";
import { IMG } from "@/content/images";
import { SPONSOR_BENEFITS, SPONSOR_EXPERIENCES, ZONES } from "@/content/festival";

export const metadata: Metadata = { title: "Marcas, patrocinadores y stands" };

export default function BrandsPage() {
  const market = ZONES.find((z) => z.name === "Good Life Market")!;
  const experience = ZONES.find((z) => z.name === "Good Life Experience Zone")!;
  return (
    <>
      <ImageHero photo={IMG.convention} eyebrow="Para marcas" title="Tu marca, parte de la experiencia">
        Contacto directo con un público interesado en bienestar y estilo de vida.
      </ImageHero>

      <section className="container-page py-20 text-center md:py-28">
        <p className="display mx-auto max-w-4xl text-4xl leading-tight text-balance sm:text-5xl">
          “Yo no solamente anuncié mi marca. <span className="text-olive italic">Mi marca fue parte del evento.</span>”
        </p>
      </section>

      {/* Patrocinio vs stand */}
      <section className="container-page grid gap-5 md:grid-cols-2">
        <article className="rounded-[2rem] bg-ink p-8 text-cream sm:p-10">
          <Megaphone className="size-8 text-sunset" />
          <h2 className="display mt-4 text-4xl">Patrocinio</h2>
          <p className="mt-2 text-cream/80">Compra visibilidad, posicionamiento y beneficios de marca.</p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {SPONSOR_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-cream/85">
                <Check className="mt-0.5 size-4 shrink-0 text-sunset" /> {b}
              </li>
            ))}
          </ul>
        </article>
        <article className="overflow-hidden rounded-[2rem] border border-border bg-card">
          <Photo photo={IMG.market} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/9]" />
          <div className="p-8 sm:p-10">
            <Store className="size-8 text-olive" />
            <h2 className="display mt-4 text-4xl">Stand en el Good Life Market</h2>
            <p className="mt-2 text-foreground/75">Compra un espacio comercial para presentar y vender tus productos. Independiente del patrocinio.</p>
            <div className="mt-6">
              <Chips items={market.items} />
            </div>
          </div>
        </article>
      </section>
      <p className="container-page mt-6 text-center text-sm text-muted-foreground">Una marca puede contratar uno o ambos.</p>

      {/* Ideas de experiencia */}
      <section className="container-page py-20 md:py-28">
        <p className="eyebrow">Experiencias de marca</p>
        <h2 className="display mt-3 max-w-3xl text-5xl text-balance sm:text-6xl">Cada patrocinador diseña una experiencia acorde con su producto</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SPONSOR_EXPERIENCES.map((e) => (
            <PhotoCard key={e.brand} photo={e.photo} title={e.idea} text={e.brand} className="min-h-72" sizes="(min-width: 1024px) 25vw, 50vw" />
          ))}
        </div>
      </section>

      {/* Experience zone */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-page grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="eyebrow">{experience.kicker}</p>
            <h2 className="display mt-3 text-5xl">{experience.name}</h2>
            <p className="mt-4 text-lg text-foreground/75">{experience.text}</p>
            <div className="mt-6">
              <Chips items={experience.items} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Photo photo={IMG.expo} sizes="25vw" className="aspect-[3/4] rounded-3xl" />
            <Photo photo={IMG.sneakers} sizes="25vw" className="mt-10 aspect-[3/4] rounded-3xl" />
          </div>
        </div>
      </section>

      <CtaBand title="¿Quieres participar con tu marca?" text="Muy pronto abriremos el registro de patrocinadores y expositores." href="/faq" label="Preguntas frecuentes" />
    </>
  );
}
