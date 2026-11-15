import Image from "next/image";
import Link from "next/link";
import { InstagramIcon } from "@/components/brand/instagram-icon";
import { SplitText } from "@/components/site/motion";
import { BRAND, BRAND_NAV } from "@/content/brand";
import { FEST, FESTIVAL_NAV } from "@/content/festival";

/** Pie compartido por el sitio de la marca y el del festival. */
export function SiteFooter({ variant }: { variant: "wellness" | "fest" }) {
  const isFest = variant === "fest";
  return (
    <footer className="overflow-hidden bg-forest text-cream">
      <div className="container-page grid gap-12 border-b border-cream/10 py-20 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-6">
          <SplitText text="Live the Good Life." italic={["good", "life."]} className="display text-6xl sm:text-7xl" />
          <p className="mt-6 max-w-md text-cream/70">
            {isFest
              ? `${FEST.date} · ${FEST.venue}, ${FEST.city}. Un evento de Good Life Wellness.`
              : "Comunidad de bienestar en Los Mochis. Síguenos para enterarte de los próximos eventos y lanzamientos."}
          </p>
          <a
            href={BRAND.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex h-12 items-center gap-2.5 rounded-full bg-cream px-6 text-sm font-semibold text-forest transition-colors hover:bg-white"
          >
            <InstagramIcon className="size-4" /> {BRAND.instagramHandle}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm lg:col-span-5 lg:col-start-8">
          <div>
            <p className="mb-5 text-xs tracking-[0.18em] text-cream/45 uppercase">Good Life Wellness</p>
            <ul className="space-y-3">
              {BRAND_NAV.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="link-line text-cream/80 hover:text-cream">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-5 text-xs tracking-[0.18em] text-cream/45 uppercase">Wellness Fest</p>
            <ul className="space-y-3">
              {[{ href: "/festival", label: "El festival" }, ...FESTIVAL_NAV, { href: "/festival/entradas", label: "Boletos" }].map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="link-line text-cream/80 hover:text-cream">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="container-page pt-12 pb-8">
        <Image
          src={isFest ? "/images/logo-wordmark-light.png" : "/images/logo-wellness-light.png"}
          alt={isFest ? "Good Life Wellness Fest" : "Good Life Wellness"}
          width={439}
          height={108}
          className="h-auto w-full opacity-90"
        />
        <div className="mt-10 flex flex-col gap-2 text-xs text-cream/45 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Good Life Wellness · Los Mochis, Sinaloa</p>
          <p>
            <Link href="/mi-cuenta" className="hover:text-cream">
              Mi cuenta
            </Link>{" "}
            · Fotografías de referencia: Unsplash
          </p>
        </div>
      </div>
    </footer>
  );
}
