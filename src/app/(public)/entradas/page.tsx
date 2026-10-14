import type { Metadata } from "next";
import { Gift, Watch } from "lucide-react";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/site/photo";
import { Chips, ImageHero } from "@/components/site/visual";
import { IMG } from "@/content/images";
import { FEST, WELCOME_KIT, WRISTBAND_USES } from "@/content/festival";

export const metadata: Metadata = { title: "Boletos" };

export default function TicketsPage() {
  return (
    <>
      <ImageHero photo={IMG.lakeEntrance} eyebrow="Boletos" title="Próximamente">
        {FEST.dateLabel} · {FEST.venue}, {FEST.city}.
      </ImageHero>

      <section className="container-page py-20 text-center md:py-28">
        <p className="eyebrow">Venta de boletos</p>
        <h2 className="display mx-auto mt-3 max-w-3xl text-5xl text-balance sm:text-6xl">Muy pronto te contaremos todos los detalles.</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/75">
          Síguenos en Instagram para enterarte en cuanto abramos la venta.
        </p>
        <Button asChild size="lg" className="mt-8 h-12 rounded-full px-7">
          <a href={FEST.instagramUrl} target="_blank" rel="noopener noreferrer">
            <InstagramIcon className="size-4" /> {FEST.instagramHandle}
          </a>
        </Button>
      </section>

      {/* Welcome kit + pulsera */}
      <section className="container-page grid gap-5 md:grid-cols-2">
        <article className="overflow-hidden rounded-[2rem] border border-border bg-card">
          <Photo photo={IMG.tote} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10]" />
          <div className="p-8">
            <Gift className="size-7 text-olive" />
            <h2 className="display mt-3 text-4xl">Welcome kit</h2>
            <p className="mt-2 text-foreground/75">Al llegar, podrá incluir:</p>
            <div className="mt-5">
              <Chips items={WELCOME_KIT} />
            </div>
          </div>
        </article>
        <article className="overflow-hidden rounded-[2rem] bg-ink text-cream">
          <Photo photo={IMG.concert} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10]" />
          <div className="p-8">
            <Watch className="size-7 text-sunset" />
            <h2 className="display mt-3 text-4xl">Pulsera Good Life</h2>
            <p className="mt-2 text-cream/80">El elemento que te identifica durante todo el festival.</p>
            <div className="mt-5">
              <Chips items={WRISTBAND_USES} tone="dark" />
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
