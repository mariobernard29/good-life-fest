import type { Metadata } from "next";
import { Photo } from "@/components/site/photo";
import { Chips, CtaBand, ImageHero, PhotoCard } from "@/components/site/visual";
import { IMG } from "@/content/images";
import { CHALLENGE_PRIZES, CHALLENGES, DAY_BLOCKS, JOURNEY, PILLARS } from "@/content/festival";

export const metadata: Metadata = { title: "Programa" };

export default function ProgramPage() {
  const disciplines = PILLARS[0].items;
  return (
    <>
      <ImageHero photo={IMG.yogaSunset} eyebrow="Programa" title="Un día completo de bienestar">
        Domingo 17 de enero de 2027, de 8:00 a 21:00 h. El programa se organiza en bloques. Una misma disciplina podrá tener dos horarios para que más personas puedan disfrutarla. El programa
        detallado se anunciará próximamente.
      </ImageHero>

      {/* Bloques del día */}
      <section className="container-page py-20 md:py-28">
        <ol className="relative space-y-12 md:space-y-0">
          {DAY_BLOCKS.map((b, i) => (
            <li key={b.time} className="grid items-center gap-6 md:grid-cols-[10rem_1fr_1fr] md:gap-10 md:py-8">
              <p className="display text-6xl text-sunset md:text-right">{String(i + 1).padStart(2, "0")}</p>
              <div>
                <p className="eyebrow">{b.time}</p>
                <h2 className="display mt-2 text-4xl">{b.title}</h2>
                <p className="mt-3 text-lg text-foreground/75">{b.text}</p>
              </div>
              <Photo photo={b.photo} sizes="(min-width: 768px) 40vw, 100vw" className="aspect-[16/10] rounded-3xl" />
            </li>
          ))}
        </ol>
      </section>

      {/* Clases */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container-page">
          <p className="eyebrow">Clases y experiencias</p>
          <h2 className="display mt-3 text-5xl sm:text-6xl">Muévete a tu ritmo</h2>
          <div className="mt-6">
            <Chips items={disciplines} />
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { p: IMG.hiit, t: "Hyrox principiantes" },
              { p: IMG.battleRopes, t: "Hyrox avanzados" },
              { p: IMG.yogaPark, t: "Yoga" },
              { p: IMG.meditation, t: "Meditación" },
              { p: IMG.mobility, t: "Movilidad" },
              { p: IMG.groupField, t: "Funcional fitness" },
              { p: IMG.functional, t: "CrossFit" },
              { p: IMG.jump, t: "Y más por anunciar" },
            ].map((c) => (
              <PhotoCard key={c.t} photo={c.p} title={c.t} className="min-h-64" sizes="(min-width: 1024px) 25vw, 50vw" />
            ))}
          </div>
        </div>
      </section>

      {/* Retos */}
      <section className="container-page grid items-center gap-12 py-20 md:grid-cols-2 md:py-28">
        <Photo photo={IMG.jump} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/5] rounded-[2rem]" />
        <div>
          <p className="eyebrow">Retos Good Life</p>
          <h2 className="display mt-3 text-5xl text-balance">Participa durante todo el día</h2>
          <div className="mt-6">
            <Chips items={CHALLENGES} />
          </div>
          <p className="mt-8 text-sm font-medium">Compite por:</p>
          <div className="mt-3">
            <Chips items={CHALLENGE_PRIZES} />
          </div>
        </div>
      </section>

      {/* Recorrido */}
      <section className="container-page">
        <p className="eyebrow">Tu recorrido</p>
        <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          {JOURNEY.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="rounded-full bg-ink px-4 py-2 text-cream">{s}</span>
              {i < JOURNEY.length - 1 && <span className="text-sunset">→</span>}
            </li>
          ))}
        </ol>
      </section>

      <CtaBand title="El programa completo, muy pronto." text="Horarios, instructores y clases se revelarán antes del lanzamiento de boletos." label="Boletos" />
    </>
  );
}
