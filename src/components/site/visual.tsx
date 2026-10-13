import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/site/photo";
import type { Photo as PhotoData } from "@/content/images";
import { FEST } from "@/content/festival";
import { cn } from "@/lib/utils";

export function Marquee({ words = FEST.pillarsLine, className }: { words?: string[]; className?: string }) {
  const row = [...words, ...words];
  return (
    <div className={cn("overflow-hidden border-y border-border bg-ink py-4 text-cream", className)} aria-hidden>
      <div className="marquee gap-10 pr-10">
        {row.map((w, i) => (
          <span key={i} className="display flex items-center gap-10 text-3xl whitespace-nowrap italic sm:text-4xl">
            {w}
            <span className="text-sunset not-italic">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Chips({ items, tone = "light" }: { items: string[]; tone?: "light" | "dark" }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((i) => (
        <li
          key={i}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm",
            tone === "light" ? "border-border bg-card text-foreground/80" : "border-cream/25 text-cream/85",
          )}
        >
          {i}
        </li>
      ))}
    </ul>
  );
}

/** Héroe interior con fotografía de fondo. */
export function ImageHero({ photo, eyebrow, title, children }: { photo: PhotoData; eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative isolate flex min-h-[62svh] items-end overflow-hidden">
      <Photo photo={photo} priority className="absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/40 to-ink/10" />
      <div className="container-page pt-28 pb-12 text-cream sm:pb-16">
        <p className="eyebrow fade-up text-cream/75">{eyebrow}</p>
        <h1 className="display fade-up mt-3 max-w-4xl text-5xl text-balance sm:text-7xl">{title}</h1>
        {children && <div className="fade-up mt-5 max-w-2xl text-lg text-cream/85">{children}</div>}
      </div>
    </section>
  );
}

/** Tarjeta con foto de fondo y texto encima. */
export function PhotoCard({ photo, title, text, className, sizes = "(min-width: 1024px) 33vw, 100vw" }: { photo: PhotoData; title: string; text?: string; className?: string; sizes?: string }) {
  return (
    <article className={cn("group relative isolate flex min-h-80 items-end overflow-hidden rounded-3xl", className)}>
      <Photo photo={photo} sizes={sizes} className="absolute inset-0 -z-10" imgClassName="group-hover:scale-105" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
      <div className="p-6 text-cream">
        <h3 className="display text-3xl leading-tight sm:text-4xl">{title}</h3>
        {text && <p className="mt-1 text-sm text-cream/85">{text}</p>}
      </div>
    </article>
  );
}

/** Mosaico de tres fotografías (una grande, dos pequeñas). */
export function Mosaic({ photos, className }: { photos: [PhotoData, PhotoData, PhotoData]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 grid-rows-2 gap-3", className)}>
      <Photo photo={photos[0]} sizes="(min-width: 1024px) 30vw, 60vw" className="row-span-2 min-h-80 rounded-3xl" />
      <Photo photo={photos[1]} sizes="(min-width: 1024px) 20vw, 40vw" className="min-h-36 rounded-3xl" />
      <Photo photo={photos[2]} sizes="(min-width: 1024px) 20vw, 40vw" className="min-h-36 rounded-3xl" />
    </div>
  );
}

export function CtaBand({ title, text, href = "/entradas", label = "Ver boletos" }: { title: string; text?: string; href?: string; label?: string }) {
  return (
    <section className="container-page mt-24">
      <div className="grain flex flex-col items-start gap-6 rounded-[2rem] bg-accent px-8 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-14">
        <div>
          <h2 className="display text-4xl text-balance sm:text-5xl">{title}</h2>
          {text && <p className="mt-2 text-foreground/70">{text}</p>}
        </div>
        <Button asChild size="lg" className="h-12 shrink-0 rounded-full px-7">
          <Link href={href}>
            {label} <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
