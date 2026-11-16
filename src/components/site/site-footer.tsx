import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { BRAND, BRAND_NAV } from "@/content/brand";
import { FEST, FESTIVAL_NAV } from "@/content/festival";

function Column({ title, items }: { title: string; items: { href: string; label: string; external?: boolean }[] }) {
  return (
    <div>
      <p className="mb-5 text-[0.7rem] tracking-[0.2em] text-cream/40 uppercase">{title}</p>
      <ul className="space-y-3 text-sm">
        {items.map((i) => (
          <li key={i.href + i.label}>
            {i.external ? (
              <a href={i.href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-cream/75 transition-colors hover:text-cream">
                <span className="link-line">{i.label}</span>
                <ArrowUpRight className="size-3 opacity-50 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            ) : (
              <Link href={i.href} className="text-cream/75 transition-colors hover:text-cream">
                <span className="link-line">{i.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pie compartido por el sitio de la marca y el del festival. */
export function SiteFooter({ variant }: { variant: "wellness" | "fest" }) {
  const isFest = variant === "fest";
  return (
    <footer className="bg-forest text-cream">
      <div className="container-page grid gap-14 pt-20 pb-16 lg:grid-cols-12 lg:pt-24">
        <div className="lg:col-span-4">
          <Link href={isFest ? "/festival" : "/"} aria-label={isFest ? "Good Life Wellness Fest, inicio" : "Good Life Wellness, inicio"} className="inline-block">
            <Image
              src={isFest ? "/images/logo-wordmark-light.png" : "/images/logo-wellness-light.png"}
              alt={isFest ? "Good Life Wellness Fest" : "Good Life Wellness"}
              width={439}
              height={108}
              className="h-auto w-36"
            />
          </Link>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-cream/60">
            {isFest
              ? `${FEST.date} · ${FEST.venue}, ${FEST.city}. Un evento de Good Life Wellness.`
              : "Comunidad de bienestar en Los Mochis. Entrenamos juntos, organizamos eventos y pronto lanzamos nuestra ropa."}
          </p>
          <a
            href={BRAND.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex h-11 items-center gap-2.5 rounded-full border border-cream/25 px-5 text-sm font-medium transition-colors hover:border-cream hover:bg-cream hover:text-forest"
          >
            <InstagramIcon className="size-4" /> {BRAND.instagramHandle}
          </a>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
          <Column title="Good Life Wellness" items={BRAND_NAV} />
          <Column title="Wellness Fest" items={[{ href: "/festival", label: "El festival" }, ...FESTIVAL_NAV, { href: "/festival/entradas", label: "Boletos" }]} />
          <Column
            title="Contacto"
            items={[
              { href: BRAND.instagramUrl, label: "Instagram", external: true },
              { href: "https://ig.me/m/goodlifewellnesslm", label: "Mensaje directo", external: true },
              { href: "/mi-cuenta", label: "Mi cuenta" },
            ]}
          />
        </div>
      </div>

      <div className="container-page">
        <div className="flex items-end justify-between gap-6 border-t border-cream/10 py-10">
          <p className="display text-4xl text-cream/90 sm:text-5xl">
            Live the <em>Good Life.</em>
          </p>
          <a href="#contenido" className="group flex shrink-0 items-center gap-2 text-xs tracking-[0.18em] text-cream/50 uppercase transition-colors hover:text-cream">
            Volver arriba
            <span className="grid size-9 place-items-center rounded-full border border-cream/20 transition-colors group-hover:border-cream">
              <ArrowUp className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </span>
          </a>
        </div>
        <div className="flex flex-col gap-2 border-t border-cream/10 py-6 text-xs text-cream/40 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Good Life Wellness · {BRAND.city}</p>
          <p>Fotografías de referencia: Unsplash</p>
        </div>
      </div>
    </footer>
  );
}
