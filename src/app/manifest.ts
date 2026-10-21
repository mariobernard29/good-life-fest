import type { MetadataRoute } from "next";
import { FEST } from "@/content/festival";

/**
 * Manifest de la app web: permite instalar el portal en la pantalla de inicio.
 * En iPhone es requisito para recibir notificaciones push (iOS 16.4+).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: FEST.name,
    short_name: "Good Life Fest",
    description: "Tu boleto virtual y tus clases del festival.",
    lang: "es-MX",
    start_url: "/mi-cuenta",
    scope: "/",
    display: "standalone",
    background_color: "#f8f4ed",
    theme_color: "#f8f4ed",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
