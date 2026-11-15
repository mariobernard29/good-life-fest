import { SiteHeader as Header } from "@/components/site/site-chrome";
import { BRAND, BRAND_NAV } from "@/content/brand";
import { FESTIVAL_NAV } from "@/content/festival";

/** Encabezado del sitio de la marca Good Life Wellness. */
export function BrandHeader() {
  return <Header brand="wellness" nav={BRAND_NAV} cta={{ href: BRAND.instagramUrl, label: "Únete" }} instagramUrl={BRAND.instagramUrl} />;
}

/** Encabezado del sitio del festival. */
export function FestivalHeader() {
  return (
    <Header
      brand="fest"
      nav={FESTIVAL_NAV}
      cta={{ href: "/festival/entradas", label: "Boletos" }}
      instagramUrl={BRAND.instagramUrl}
      topNote={{ href: "/", label: "← Good Life Wellness" }}
      menuExtra={{ href: "/", label: "Ir a Good Life Wellness" }}
    />
  );
}
