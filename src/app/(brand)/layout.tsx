import { BrandHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SmoothScroll } from "@/components/site/motion";

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <BrandHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter variant="wellness" />
    </>
  );
}
