import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { FEST } from "@/content/festival";
import { PUBLIC_NAV } from "@/components/site/site-header";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo variant="light" className="w-44" />
          <p className="max-w-sm text-sm text-cream/70">{FEST.arrival}</p>
          <a href={FEST.mapsUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-cream/70 hover:text-cream">
            {FEST.venue} · {FEST.city}
          </a>
        </div>
        <div>
          <p className="eyebrow mb-4 text-cream/50">Festival</p>
          <ul className="space-y-2 text-sm">
            {[...PUBLIC_NAV, { href: "/entradas", label: "Boletos" }].map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-cream/80 hover:text-cream">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4 text-cream/50">Live the Good Life</p>
          <p className="display text-3xl leading-tight text-cream/90">Fitness. Health. Wellness. Lifestyle.</p>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-cream/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Good Life Wellness Fest</p>
          <p>Fotografías de referencia: Unsplash · Sede: Lago Ávila</p>
        </div>
      </div>
    </footer>
  );
}
