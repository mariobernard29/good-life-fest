import type { Metadata } from "next";
import { FestivalHeader } from "@/components/site/site-header";
import { SmoothScroll } from "@/components/site/motion";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  title: { default: "Good Life Wellness Fest · Lago Ávila, Los Mochis", template: "%s · Good Life Wellness Fest" },
  description:
    "Festival de bienestar de Good Life Wellness en el Lago Ávila, Los Mochis, Sinaloa. Clases, conferencias, experiencias y marcas de bienestar.",
  openGraph: { siteName: "Good Life Wellness Fest", images: ["/images/hero-logo-lago.jpg"] },
};

export default function FestivalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <FestivalHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter variant="fest" />
    </>
  );
}
