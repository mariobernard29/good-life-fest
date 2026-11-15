import Link from "next/link";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { Logo } from "@/components/brand/logo";
import { FEST } from "@/content/festival";
import { PUBLIC_NAV } from "@/components/site/site-header";

/** Pie del sitio del festival. */
export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo brand="fest" variant="light" className="w-44" />
          <p className="max-w-sm text-sm text-cream/70">{FEST.arrival}</p>
          <a href={FEST.mapsUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-cream/70 hover:text-cream">
            {FEST.venue} · {FEST.city}
          </a>
          <a href={FEST.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-2 text-sm text-cream/70 hover:text-cream">
            <InstagramIcon className="size-4" /> {FEST.instagramHandle}
          </a>
        </div>
        <div>
          <p className="eyebrow mb-4 text-cream/50">Festival</p>
          <ul className="space-y-2 text-sm">
            {[{ href: "/festival", label: "Inicio del festival" }, ...PUBLIC_NAV, { href: "/festival/entradas", label: "Boletos" }].map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-cream/80 hover:text-cream">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <p className="eyebrow text-cream/50">Un evento de</p>
          <Logo brand="wellness" variant="light" className="w-40" />
          <p className="text-sm text-cream/70">Comunidad, eventos, ropa y accesorios para vivir mejor.</p>
          <Link href="/" className="inline-block text-sm text-cream/85 underline-offset-4 hover:text-cream hover:underline">
            Conoce Good Life Wellness →
          </Link>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-cream/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Good Life Wellness · Good Life Wellness Fest</p>
          <p>Fotografías de referencia: Unsplash · Sede: Lago Ávila</p>
        </div>
      </div>
    </footer>
  );
}
