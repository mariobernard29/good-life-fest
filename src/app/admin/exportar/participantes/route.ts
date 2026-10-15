import type { NextRequest } from "next/server";
import { exportResponse, parseFormat } from "@/lib/exports/respond";
import { fetchParticipants } from "@/lib/exports/data";
import { exportFileName, toParticipantRows } from "@/lib/exports/rows";
import { participantsWorkbook } from "@/lib/exports/xlsx";
import { participantsPdf } from "@/lib/exports/pdf";

/** Respaldo de participantes en Excel (todos los datos) o PDF (nombre, correo y pulsera). */
export async function GET(request: NextRequest) {
  const format = parseFormat(request.nextUrl.searchParams.get("formato"));
  return exportResponse("participantes", async (ctx) => {
    const tz = ctx.event.timezone;
    const rows = toParticipantRows(await fetchParticipants(ctx.event.id), tz);
    const body = format === "pdf" ? participantsPdf(rows, tz) : await participantsWorkbook(rows);
    return { body, format, rows: rows.length, filename: exportFileName("participantes", format) };
  });
}
