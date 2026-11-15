"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { UserRound } from "lucide-react";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string };

/** Enlace interno o externo (los externos abren en otra pestaña). */
function SmartLink({ href, ...props }: React.ComponentProps<"a"> & { href: string }) {
  return href.startsWith("http") ? <a href={href} target="_blank" rel="noopener noreferrer" {...props} /> : <Link href={href} {...props} />;
}

const LOGOS = {
  wellness: { dark: "/images/logo-wellness.png", light: "/images/logo-wellness-light.png", w: 438, h: 108, alt: "Good Life Wellness", home: "/" },
  fest: { dark: "/images/logo-wordmark.png", light: "/images/logo-wordmark-light.png", w: 438, h: 109, alt: "Good Life Wellness Fest", home: "/festival" },
};

/** Rutas cuyo inicio no es una foto oscura: el encabezado arranca sólido. */
const SOLID_PATHS = ["/comprar"];

/**
 * Encabezado del sitio público. Transparente sobre el héroe, sólido al bajar,
 * se oculta al hacer scroll hacia abajo y reaparece al subir.
 */
export function SiteHeader({
  brand,
  nav,
  cta,
  instagramUrl,
  menuExtra,
  topNote,
}: {
  brand: keyof typeof LOGOS;
  nav: Item[];
  cta: Item;
  instagramUrl: string;
  /** Enlace secundario en el menú (p. ej. volver a la marca). */
  menuExtra?: Item;
  /** Texto pequeño a la izquierda del menú en escritorio. */
  topNote?: Item;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const solid = scrolled || open || SOLID_PATHS.some((p) => pathname.startsWith(p));
  const logo = LOGOS[brand];

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 160 && y > last + 4 ? true : y < last - 4 ? false : (h) => h);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const light = !solid; // texto claro sobre la foto

  return (
    <>
      <header
        data-hidden={hidden && !open}
        className={cn(
          "site-header fixed inset-x-0 top-0 z-50 border-b",
          solid ? "border-forest/10 bg-background/90 text-forest backdrop-blur-md" : "border-transparent bg-transparent text-cream",
        )}
      >
        <div className="container-page flex h-18 items-center justify-between gap-6">
          <Link href={logo.home} aria-label={`${logo.alt}, inicio`} className="relative z-10 shrink-0" onClick={() => setOpen(false)}>
            <Image src={light ? logo.light : logo.dark} alt={logo.alt} width={logo.w} height={logo.h} priority className="h-auto w-32 sm:w-36" />
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
            {topNote && (
              <Link href={topNote.href} className={cn("text-xs tracking-wide transition-opacity hover:opacity-100", light ? "opacity-70" : "opacity-60")}>
                {topNote.label}
              </Link>
            )}
            {nav.map((item) => {
              const active = !item.href.includes("#") && (pathname === item.href || pathname.startsWith(`${item.href}/`));
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("text-sm font-medium", active && "underline underline-offset-8")}>
                  <span className="link-line">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="relative z-10 flex items-center gap-1 sm:gap-2">
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram de Good Life Wellness" className="grid size-10 place-items-center rounded-full transition-colors hover:bg-current/10">
              <InstagramIcon className="size-[1.15rem]" />
            </a>
            <Link href="/mi-cuenta" aria-label="Mi cuenta" className="grid size-10 place-items-center rounded-full transition-colors hover:bg-current/10">
              <UserRound className="size-[1.15rem]" />
            </Link>
            <SmartLink
              href={cta.href}
              className={cn(
                "ml-2 hidden h-10 items-center rounded-full px-5 text-sm font-semibold transition-colors sm:inline-flex",
                light ? "bg-cream text-forest hover:bg-white" : "bg-forest text-cream hover:bg-olive",
              )}
            >
              {cta.label}
            </SmartLink>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="menu-movil"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="ml-1 grid size-10 place-items-center lg:hidden"
            >
              <span className="relative block h-3 w-6">
                <span className={cn("absolute left-0 h-px w-6 bg-current transition-all duration-500", open ? "top-1.5 rotate-45" : "top-0")} />
                <span className={cn("absolute left-0 h-px w-6 bg-current transition-all duration-500", open ? "top-1.5 -rotate-45" : "top-3")} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div id="menu-movil" data-open={open} className="menu-panel fixed inset-0 z-40 flex flex-col bg-background px-5 pt-28 pb-10 text-forest sm:px-8 lg:hidden" aria-hidden={!open}>
        <nav aria-label="Menú móvil" className="flex flex-col">
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="menu-item display border-b border-forest/10 py-4 text-4xl"
              style={{ "--i": i } as CSSProperties}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="menu-item mt-auto grid gap-3" style={{ "--i": nav.length } as CSSProperties}>
          <SmartLink href={cta.href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} className="flex h-12 items-center justify-center rounded-full bg-forest text-sm font-semibold text-cream">
            {cta.label}
          </SmartLink>
          {menuExtra && (
            <Link href={menuExtra.href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} className="flex h-12 items-center justify-center rounded-full border border-forest/20 text-sm font-semibold">
              {menuExtra.label}
            </Link>
          )}
          <div className="mt-2 flex justify-center gap-6 text-sm text-forest/70">
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
              Instagram
            </a>
            <Link href="/mi-cuenta" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
              Mi cuenta
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
