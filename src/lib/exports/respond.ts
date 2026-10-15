import "server-only";
import { NextResponse } from "next/server";
import { requireStaff, type StaffContext } from "@/lib/auth/staff";
import { AppError, logError } from "@/lib/errors";
import { audit } from "@/lib/admin/common";

const CONTENT_TYPE = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
} as const;

export type ExportFormat = keyof typeof CONTENT_TYPE;

export function parseFormat(value: string | null): ExportFormat {
  return value === "pdf" ? "pdf" : "xlsx";
}

/**
 * Envoltura común de las descargas: verifica el permiso `exports.download`
 * (contienen datos personales), registra la descarga en auditoría y responde
 * como archivo adjunto sin caché.
 */
export async function exportResponse(
  kind: string,
  build: (ctx: StaffContext) => Promise<{ body: Buffer; filename: string; format: ExportFormat; rows: number }>,
) {
  let ctx: StaffContext;
  try {
    ctx = await requireStaff("exports.download");
  } catch (error) {
    const status = error instanceof AppError && error.code === "UNAUTHENTICATED" ? 401 : 403;
    return new NextResponse(status === 401 ? "Inicia sesión para descargar." : "No tienes permiso para exportar.", { status });
  }
  try {
    const file = await build(ctx);
    await audit({
      actorId: ctx.user.id,
      eventId: ctx.event.id,
      action: "export.downloaded",
      entity: "export",
      entityId: kind,
      details: { format: file.format, rows: file.rows },
    });
    return new NextResponse(new Uint8Array(file.body), {
      headers: {
        "Content-Type": CONTENT_TYPE[file.format],
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logError(`export.${kind}`, error);
    return new NextResponse("No se pudo generar el archivo. Intenta de nuevo.", { status: 500 });
  }
}
