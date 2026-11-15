import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

const sans = Manrope({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "Good Life Wellness · Comunidad, eventos y lifestyle en Los Mochis", template: "%s · Good Life Wellness" },
  description:
    "Good Life Wellness: marca de bienestar en Los Mochis, Sinaloa. Comunidad, eventos, ropa y accesorios. Organizadores de Good Life Wellness Fest.",
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Good Life Wellness",
    images: ["/images/hero-logo-lago.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f4ed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster theme="light" position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
