import type { Metadata } from "next";
import { Photo } from "@/components/site/photo";
import { CtaBand, Figure, PageHero, SectionHead, SectionLabel, TagList } from "@/components/site/visual";
import { HorizontalScroll, ImageReveal, Reveal, SplitText } from "@/components/site/motion";
import { IMG } from "@/content/images";
import { FEST, SPONSOR_BENEFITS, SPONSOR_EXPERIENCES, ZONES } from "@/content/festival";

export const metadata: Metadata = { title: "Marcas, patrocinadores y stands" };

export default function BrandsPage() {
  const market = ZONES.find((z) => z.name === "Good Life Market")!;
  const experience = ZONES.find((z) => z.name === "Good Life Experience Zone")!;
  return (
    <>
      <PageHero photo={IMG.experienceHall} label="Para marcas" title="Que tu marca sea parte de la experiencia." italic={["experiencia."]}>
        Conecta en persona con gente que ya está interesada en cuidarse.
      </PageHero>

      <section className="container-page py-24 sm:py-36">
        <SplitText
          as="p"
          text="“No solo anuncié mi marca. Mi marca fue parte del evento.”"
          italic={["fue", "parte", "del", "evento.”"]}
          className="display mx-auto max-w-5xl text-center text-4xl leading-tight text-balance text-forest sm:text-6xl"
        />
        <Reveal className="mt-6 text-center text-sm text-foreground/55">Lo que buscamos que diga cada marca al terminar el festival.</Reveal>
      </section>

      {/* Patrocinio vs stand */}
      <section className="container-page grid gap-16 pb-24 sm:pb-32 lg:grid-cols-2 lg:gap-10">
        <article className="bg-forest p-8 text-cream sm:p-12">
          <SectionLabel n="A" tone="dark">
            Patrocinio
          </SectionLabel>
          <h2 className="display mt-6 text-5xl">Visibilidad y presencia</h2>
          <p className="mt-4 max-w-md text-cream/75">Tu marca en el escenario, en redes y en los materiales del festival, con una experiencia propia para los asistentes.</p>
          <TagList items={SPONSOR_BENEFITS} tone="dark" className="mt-10" />
        </article>
        <article>
          <ImageReveal className="aspect-[16/10]">
            <Photo photo={IMG.market} sizes="(min-width: 1024px) 50vw, 100vw" className="h-full w-full" />
          </ImageReveal>
          <div className="pt-8">
            <SectionLabel n="B">Stand</SectionLabel>
            <h2 className="display mt-6 text-5xl text-forest">Espacio en el Good Life Market</h2>
            <p className="mt-4 max-w-md text-foreground/70">Presenta y vende tus productos directamente. Se contrata aparte del patrocinio, o junto con él.</p>
            <TagList items={market.items} columns={2} className="mt-10" />
          </div>
        </article>
      </section>

      {/* Ideas de experiencia */}
      <section className="bg-secondary/60">
        <HorizontalScroll
          className="py-24 lg:py-0"
          header={
            <div className="container-page mb-12">
              <SectionHead label="Experiencias de marca" title="Cada marca arma algo acorde a lo que vende." italic={["vende."]} />
            </div>
          }
        >
          {SPONSOR_EXPERIENCES.map((e, i) => (
            <Figure
              key={e.brand}
              photo={e.photo}
              title={e.idea}
              meta={`0${i + 1} · ${e.brand}`}
              aspect="aspect-[4/5]"
              sizes="(min-width: 1024px) 24vw, 70vw"
              className="w-[70vw] shrink-0 snap-start sm:w-[40vw] lg:w-[24vw]"
            />
          ))}
        </HorizontalScroll>
      </section>

      {/* Experience zone */}
      <section className="container-page grid gap-12 py-24 sm:py-32 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <SectionLabel>{experience.kicker}</SectionLabel>
          <h2 className="display mt-7 text-5xl text-forest sm:text-6xl">{experience.name}</h2>
          <p className="mt-6 text-lg leading-relaxed text-foreground/75">{experience.text}</p>
          <TagList items={experience.items} className="mt-10" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-6 lg:col-start-7">
          <ImageReveal className="aspect-[3/4]">
            <Photo photo={IMG.gymHighFive} sizes="25vw" className="h-full w-full" />
          </ImageReveal>
          <ImageReveal className="mt-16 aspect-[3/4]" delay={150}>
            <Photo photo={IMG.apparel} sizes="25vw" className="h-full w-full" />
          </ImageReveal>
        </div>
      </section>

      <CtaBand title="¿Quieres participar con tu marca?" text={`Mándanos un DM a ${FEST.instagramHandle} y te pasamos la información para patrocinadores y stands.`} href={FEST.instagramUrl} label="Escríbenos por Instagram" photo={IMG.festivalGolden} />
    </>
  );
}
