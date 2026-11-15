import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { Logo } from "@/components/brand/logo";
import { FEST } from "@/content/festival";
import { Button } from "@/components/ui/button";
import { MobileNav, NavLinks } from "@/components/site/nav-links";

/** Navegación del festival (todas sus páginas viven bajo /festival). */
export const PUBLIC_NAV = [
  { href: "/festival/experiencias", label: "La experiencia" },
  { href: "/festival/programa", label: "Programa" },
  { href: "/festival/conferencias", label: "Good Life Stage" },
  { href: "/festival/expositores", label: "Marcas" },
  { href: "/festival/faq", label: "Preguntas" },
];

/** Encabezado del sitio del festival. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="hidden bg-ink text-cream sm:block">
        <div className="container-page flex h-8 items-center justify-between text-xs">
          <Link href="/" className="flex items-center gap-1.5 text-cream/75 hover:text-cream">
            <ArrowLeft className="size-3.5" /> Good Life Wellness
          </Link>
          <p className="text-cream/60">Un evento de Good Life Wellness · {FEST.dateLabel}</p>
        </div>
      </div>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo brand="fest" className="w-32 sm:w-36" priority />
        <NavLinks items={PUBLIC_NAV} />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon-lg" className="rounded-full" aria-label="Instagram de Good Life Wellness">
            <a href={FEST.instagramUrl} target="_blank" rel="noopener noreferrer">
              <InstagramIcon className="size-5" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon-lg" className="rounded-full" aria-label="Mi cuenta">
            <Link href="/mi-cuenta">
              <UserRound className="size-5" />
            </Link>
          </Button>
          <Button asChild size="lg" className="hidden rounded-full px-5 sm:inline-flex">
            <Link href="/festival/entradas">Boletos</Link>
          </Button>
          <MobileNav
            items={[{ href: "/festival", label: "El festival" }, ...PUBLIC_NAV]}
            instagramUrl={FEST.instagramUrl}
            cta={{ href: "/festival/entradas", label: "Boletos" }}
            extra={{ href: "/", label: "← Good Life Wellness" }}
          />
        </div>
      </div>
    </header>
  );
}
