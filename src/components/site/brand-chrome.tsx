import Link from "next/link";
import { UserRound } from "lucide-react";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { MobileNav, NavLinks } from "@/components/site/nav-links";
import { BRAND, BRAND_NAV } from "@/content/brand";
import { FEST } from "@/content/festival";

/** Encabezado del sitio de la marca Good Life Wellness. */
export function BrandHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo brand="wellness" className="w-32 sm:w-36" priority />
        <NavLinks items={BRAND_NAV} />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon-lg" className="rounded-full" aria-label="Instagram de Good Life Wellness">
            <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">
              <InstagramIcon className="size-5" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon-lg" className="rounded-full" aria-label="Mi cuenta">
            <Link href="/mi-cuenta">
              <UserRound className="size-5" />
            </Link>
          </Button>
          <Button asChild size="lg" className="hidden rounded-full px-5 sm:inline-flex">
            <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">
              Únete
            </a>
          </Button>
          <MobileNav items={BRAND_NAV} instagramUrl={BRAND.instagramUrl} cta={{ href: "/festival", label: "Good Life Wellness Fest" }} />
        </div>
      </div>
    </header>
  );
}

/** Pie del sitio de la marca. */
export function BrandFooter() {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo brand="wellness" variant="light" className="w-48" />
          <p className="max-w-sm text-sm text-cream/70">{BRAND.lead}</p>
          <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-2 text-sm text-cream/70 hover:text-cream">
            <InstagramIcon className="size-4" /> {BRAND.instagramHandle}
          </a>
        </div>
        <div>
          <p className="eyebrow mb-4 text-cream/50">Good Life</p>
          <ul className="space-y-2 text-sm">
            {[...BRAND_NAV, { href: "/mi-cuenta", label: "Mi cuenta" }].map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-cream/80 hover:text-cream">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <p className="eyebrow text-cream/50">Próximo evento</p>
          <Logo brand="fest" variant="light" className="w-40" />
          <p className="text-sm text-cream/70">
            {FEST.date} · {FEST.venue}
          </p>
          <Link href="/festival" className="inline-block text-sm text-cream/85 underline-offset-4 hover:text-cream hover:underline">
            Ir al sitio del festival →
          </Link>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-cream/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Good Life Wellness · {BRAND.city}</p>
          <p>Fotografías de referencia: Unsplash</p>
        </div>
      </div>
    </footer>
  );
}
