import Link from "next/link";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { Logo } from "@/components/brand/logo";
import { FEST } from "@/content/festival";
import { Button } from "@/components/ui/button";
import { MobileNav, NavLinks } from "@/components/site/nav-links";

export const PUBLIC_NAV = [
  { href: "/experiencias", label: "La experiencia" },
  { href: "/programa", label: "Programa" },
  { href: "/conferencias", label: "Good Life Stage" },
  { href: "/expositores", label: "Marcas" },
  { href: "/faq", label: "Preguntas" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo className="w-32 sm:w-36" priority />
        <NavLinks items={PUBLIC_NAV} />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon-lg" className="rounded-full" aria-label="Instagram de Good Life Wellness Fest">
            <a href={FEST.instagramUrl} target="_blank" rel="noopener noreferrer">
              <InstagramIcon className="size-5" />
            </a>
          </Button>
          <Button asChild size="lg" className="hidden rounded-full px-5 sm:inline-flex">
            <Link href="/entradas">Boletos</Link>
          </Button>
          <MobileNav items={PUBLIC_NAV} />
        </div>
      </div>
    </header>
  );
}
