import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Photo } from "@/components/site/photo";
import { ImageReveal, Parallax, SplitText } from "@/components/site/motion";
import type { Photo as PhotoData } from "@/content/images";
import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

/** Etiqueta de sección: número + nombre, con una línea fina. */
export function SectionLabel({ n, children, tone = "light", className }: { n?: string; children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 text-xs font-medium tracking-[0.18em] uppercase", tone === "light" ? "text-forest/60" : "text-cream/60", className)}>
      {n && <span className="font-mono tracking-normal">{n}</span>}
      <span className={cn("h-px w-8", tone === "light" ? "bg-forest/30" : "bg-cream/30")} />
      {children}
    </p>
  );
}

/** Botón-enlace con forma de píldora. Detecta enlaces externos. */
export function PillLink({
  href,
  children,
  variant = "dark",
  className,
  icon = "arrow",
}: {
  href: string;
  children: ReactNode;
  variant?: "dark" | "light" | "outline-light" | "outline-dark";
  className?: string;
  icon?: "arrow" | "external" | null;
}) {
  const external = href.startsWith("http");
  const cls = cn(
    "group inline-flex h-12 items-center gap-2.5 rounded-full px-6 text-sm font-semibold transition-colors duration-300",
    variant === "dark" && "bg-forest text-cream hover:bg-olive",
    variant === "light" && "bg-cream text-forest hover:bg-white",
    variant === "outline-light" && "border border-cream/40 text-cream hover:border-cream hover:bg-cream/10",
    variant === "outline-dark" && "border border-forest/25 text-forest hover:border-forest",
    className,
  );
  const Icon = icon === "external" ? ArrowUpRight : icon === "arrow" ? ArrowRight : null;
  const inner = (
    <>
      {children}
      {Icon && <Icon className="size-4 transition-transform duration-500 group-hover:translate-x-1" />}
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

/** Enlace de texto con subrayado animado. */
export function TextLink({ href, children, tone = "light", className }: { href: string; children: ReactNode; tone?: Tone; className?: string }) {
  const external = href.startsWith("http");
  const cls = cn("group inline-flex items-center gap-2 text-sm font-semibold", tone === "light" ? "text-forest" : "text-cream", className);
  const inner = (
    <>
      <span className="link-line">{children}</span>
      <ArrowRight className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

/** Lista con líneas finas (sustituye a las etiquetas tipo «chip»). */
export function TagList({ items, tone = "light", columns = 2, className }: { items: string[]; tone?: Tone; columns?: 1 | 2 | 3; className?: string }) {
  return (
    <ul
      className={cn(
        "grid gap-x-8 border-t text-[0.95rem]",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        tone === "light" ? "border-forest/15 text-foreground/80" : "border-cream/15 text-cream/80",
        className,
      )}
    >
      {items.map((i) => (
        <li key={i} className={cn("flex items-center gap-3 border-b py-3", tone === "light" ? "border-forest/15" : "border-cream/15")}>
          <span className={cn("size-1 shrink-0 rounded-full", tone === "light" ? "bg-sunset" : "bg-sunset")} />
          {i}
        </li>
      ))}
    </ul>
  );
}

/** Encabezado de sección: etiqueta, titular animado y texto opcional. */
export function SectionHead({
  n,
  label,
  title,
  italic,
  children,
  tone = "light",
  className,
  aside,
}: {
  n?: string;
  label: string;
  title: string;
  italic?: string[];
  children?: ReactNode;
  tone?: Tone;
  className?: string;
  aside?: ReactNode;
}) {
  return (
    <div className={cn("grid gap-8 lg:grid-cols-12 lg:items-end", className)}>
      <div className="lg:col-span-7">
        <SectionLabel n={n} tone={tone}>
          {label}
        </SectionLabel>
        <SplitText text={title} italic={italic} className={cn("display mt-6 text-5xl text-balance sm:text-6xl lg:text-7xl", tone === "light" ? "text-forest" : "text-cream")} />
      </div>
      {(children || aside) && (
        <div className={cn("lg:col-span-4 lg:col-start-9", tone === "light" ? "text-foreground/70" : "text-cream/75")}>
          {children && <div className="text-lg leading-relaxed">{children}</div>}
          {aside && <div className="mt-6">{aside}</div>}
        </div>
      )}
    </div>
  );
}

/** Héroe interior: foto a sangre con parallax, titular grande abajo. */
export function PageHero({ photo, label, title, italic, children }: { photo: PhotoData; label: string; title: string; italic?: string[]; children?: ReactNode }) {
  return (
    <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden bg-forest text-cream">
      <Parallax className="absolute inset-0 -z-10" speed={0.18}>
        <div className="hero-zoom h-full w-full">
          <Photo photo={photo} priority className="h-full w-full" />
        </div>
      </Parallax>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest via-forest/45 to-forest/25" />
      <div className="container-page pt-36 pb-14 sm:pb-20">
        <SectionLabel tone="dark" className="fade-up">
          {label}
        </SectionLabel>
        <SplitText as="h1" text={title} italic={italic} className="display mt-6 max-w-5xl text-6xl text-balance sm:text-7xl lg:text-8xl" />
        {children && (
          <div className="fade-up mt-8 max-w-xl text-lg leading-relaxed text-cream/80" style={{ "--d": "400ms" } as React.CSSProperties}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

/** Foto con pie (estilo editorial) y zoom suave al pasar el cursor. */
export function Figure({
  photo,
  title,
  text,
  meta,
  className,
  aspect = "aspect-[4/5]",
  sizes = "(min-width: 1024px) 33vw, 100vw",
  tone = "light",
}: {
  photo: PhotoData;
  title: string;
  text?: string;
  meta?: string;
  className?: string;
  aspect?: string;
  sizes?: string;
  tone?: Tone;
}) {
  return (
    <figure className={cn("group", className)}>
      <ImageReveal className={aspect}>
        <Photo photo={photo} sizes={sizes} className="h-full w-full" imgClassName="duration-[1.6s] group-hover:scale-[1.04]" />
      </ImageReveal>
      <figcaption className="mt-5">
        {meta && <p className={cn("font-mono text-xs", tone === "light" ? "text-forest/50" : "text-cream/50")}>{meta}</p>}
        <p className={cn("display mt-1 text-3xl", tone === "light" ? "text-forest" : "text-cream")}>{title}</p>
        {text && <p className={cn("mt-2 text-[0.95rem] leading-relaxed", tone === "light" ? "text-foreground/65" : "text-cream/70")}>{text}</p>}
      </figcaption>
    </figure>
  );
}

/** Banda final a sangre con foto de fondo. */
export function CtaBand({
  title,
  text,
  href = "/festival/entradas",
  label = "Ver boletos",
  photo,
  italic,
}: {
  title: string;
  text?: string;
  href?: string;
  label?: string;
  photo?: PhotoData;
  italic?: string[];
}) {
  return (
    <section className="relative isolate overflow-hidden bg-forest py-28 text-cream sm:py-36">
      {photo && (
        <>
          <Parallax className="absolute inset-0 -z-10" speed={0.2}>
            <Photo photo={photo} className="h-full w-full" />
          </Parallax>
          <div className="absolute inset-0 -z-10 bg-forest/75" />
        </>
      )}
      <div className="container-page grid gap-10 lg:grid-cols-12 lg:items-end">
        <SplitText text={title} italic={italic} className="display text-5xl text-balance sm:text-7xl lg:col-span-8" />
        <div className="lg:col-span-4 lg:justify-self-end">
          {text && <p className="mb-6 max-w-sm text-cream/75">{text}</p>}
          <PillLink href={href} variant="light" icon={href.startsWith("http") ? "external" : "arrow"}>
            {label}
          </PillLink>
        </div>
      </div>
    </section>
  );
}
