import "server-only";
import { headers } from "next/headers";
import { AppError } from "@/lib/errors";

/**
 * Limitador de ventana fija en memoria. Protege endpoints sensibles contra
 * abuso básico en una sola instancia. En despliegues con varias instancias
 * (serverless) conviene sustituirlo por un almacén compartido (p. ej. Upstash Redis);
 * la interfaz está aislada aquí para ese cambio.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Lanza RATE_LIMITED si se supera el límite para esta IP y acción. */
export async function enforceRateLimit(action: string, limit: number, windowMs: number, subject?: string) {
  const key = `${action}:${subject ?? (await clientIp())}`;
  if (!checkRateLimit(key, limit, windowMs)) throw new AppError("RATE_LIMITED");
}
