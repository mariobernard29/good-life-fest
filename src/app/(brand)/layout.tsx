import { BrandFooter, BrandHeader } from "@/components/site/brand-chrome";

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BrandHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <BrandFooter />
    </>
  );
}
