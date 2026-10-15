import type { NextRequest } from "next/server";
import { exportResponse, parseFormat } from "@/lib/exports/respond";
import { fetchClassRosterSources } from "@/lib/exports/data";
import { exportFileName, toClassRosters } from "@/lib/exports/rows";
import { classesWorkbook } from "@/lib/exports/xlsx";
import { classesPdf } from "@/lib/exports/pdf";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Quién va a qué clase: todas las sesiones con reserva, o una sola con
 * ?actividad=<id> / ?conferencia=<id>.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const format = parseFormat(sp.get("formato"));
  const activityId = sp.get("actividad") ?? undefined;
  const conferenceId = sp.get("conferencia") ?? undefined;
  const filter = {
    activityId: activityId && UUID.test(activityId) ? activityId : undefined,
    conferenceId: conferenceId && UUID.test(conferenceId) ? conferenceId : undefined,
  };

  return exportResponse("clases", async (ctx) => {
    const tz = ctx.event.timezone;
    const { sessions, reservations } = await fetchClassRosterSources(ctx.event.id, filter);
    const rosters = toClassRosters(sessions, reservations, tz);
    const body = format === "pdf" ? classesPdf(rosters, tz) : await classesWorkbook(rosters);
    const base = rosters.length === 1 && (filter.activityId || filter.conferenceId) ? `asistencia ${rosters[0].name}` : "asistencia por clase";
    return { body, format, rows: reservations.length, filename: exportFileName(base, format) };
  });
}
