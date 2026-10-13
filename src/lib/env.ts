import { z } from "zod";

/**
 * Variables de entorno. Las NEXT_PUBLIC_* se leen de forma explícita para que
 * Next.js las incruste en el bundle del navegador; el resto solo existe en el servidor.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

export function getPublicEnv() {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function isSupabaseConfigured(): boolean {
  return publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  }).success;
}

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

/** "development" | "test" | "production". */
export function getAppEnv(): "development" | "test" | "production" {
  const v = process.env.APP_ENV;
  return v === "production" || v === "test" ? v : "development";
}

export function getEventSlug(): string | undefined {
  return process.env.EVENT_SLUG || undefined;
}

export function getSecretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY no está configurada");
  return key;
}


/**
 * Pago simulado (demostración): confirma pedidos sin cobrar. Activo por defecto mientras no
 * exista pasarela real; desactívalo con DEMO_PAYMENTS=false.
 */
export function isDemoPaymentsEnabled(): boolean {
  return process.env.DEMO_PAYMENTS !== "false";
}
