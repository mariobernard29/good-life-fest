import { AppError, isErrorCode } from "@/lib/errors";

/**
 * Interfaz mínima para invocar las funciones transaccionales de PostgreSQL.
 * En producción se implementa con el cliente service_role de Supabase
 * (src/lib/db/server-rpc.ts); en pruebas, con PGlite (tests/helpers/db.ts).
 */
export interface RpcClient {
  call<T>(fn: string, args: Record<string, unknown>): Promise<T>;
}

/** Convierte un error de PostgreSQL/PostgREST en AppError. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const e = error as { message?: string; detail?: string; details?: string } | null;
  const message = e?.message ?? "";
  const match = /GLF:([A-Z_]+)/.exec(message);
  if (match && isErrorCode(match[1])) {
    return new AppError(match[1], e?.detail ?? e?.details ?? undefined);
  }
  return new AppError("UNKNOWN", message.slice(0, 300));
}
