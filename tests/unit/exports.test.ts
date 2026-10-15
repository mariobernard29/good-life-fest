import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import {
  exportFileName,
  sortByName,
  toClassRosters,
  toParticipantRows,
  type ParticipantSource,
  type ReservationSource,
  type SessionSource,
} from "@/lib/exports/rows";
import { classesWorkbook, participantsWorkbook } from "@/lib/exports/xlsx";
import { classesPdf, participantsPdf } from "@/lib/exports/pdf";

function ticket(name: string, opts: Partial<ParticipantSource> = {}): ParticipantSource {
  return {
    public_code: `GL-${name.slice(0, 5).toUpperCase().padEnd(5, "X")}-00000`,
    attendee_name: name,
    attendee_email: null,
    status: "valid",
    issued_at: "2027-01-10T18:00:00.000Z",
    checked_in_at: null,
    wristband_delivered_at: null,
    ticket_types: { name: "General" },
    profiles: { full_name: name, email: `${name.toLowerCase()}@correo.mx`, phone: "6681234567", age: 30, activated_at: null },
    order_items: { orders: { buyer_name: name, buyer_email: "x@correo.mx", buyer_phone: null, status: "paid", channel: "box_office", sale_source: "mensaje" } },
    ...opts,
  };
}

describe("Exportaciones", () => {
  it("ordena alfabéticamente en español ignorando acentos y mayúsculas", () => {
    const names = ["beatriz", "Zoe", "Álvaro", "ángel", "Ñoño", "Nadia"].map((name) => ({ name }));
    expect(sortByName(names).map((n) => n.name)).toEqual(["Álvaro", "ángel", "beatriz", "Nadia", "Ñoño", "Zoe"]);
  });

  it("participantes: nombre/correo con respaldo, pulsera, cuenta y origen de venta", () => {
    const rows = toParticipantRows([
      ticket("Zoe", { wristband_delivered_at: "2027-01-12T18:00:00.000Z" }),
      ticket("", { profiles: null, attendee_email: "sin@cuenta.mx", order_items: { orders: { buyer_name: "Bruno", buyer_email: "b@correo.mx", buyer_phone: "1", status: "awaiting_payment", channel: "box_office", sale_source: "punto_fisico" } } }),
      ticket("Ana", { profiles: { full_name: "Ana", email: "ana@correo.mx", phone: null, age: 41, activated_at: "2027-01-11T00:00:00.000Z" } }),
    ]);
    expect(rows.map((r) => r.name)).toEqual(["Ana", "Bruno", "Zoe"]);
    expect(rows[0]).toMatchObject({ email: "ana@correo.mx", account: "Activada", wristband: "Pendiente", age: 41, saleSource: "Por mensaje" });
    expect(rows[1]).toMatchObject({ email: "sin@cuenta.mx", account: "Sin cuenta", payment: "Pago por confirmar", saleSource: "Punto físico" });
    expect(rows[2]).toMatchObject({ wristband: "Entregada", account: "Sin activar" });
  });

  it("clases: agrupa por sesión en orden de horario y separa la lista de espera", () => {
    const sessions: SessionSource[] = [
      { id: "b", kind: "activity", name: "Baño de sonido", starts_at: "2027-01-18T01:00:00.000Z", ends_at: "2027-01-18T02:00:00.000Z", location: "Jardín", capacity: 2 },
      { id: "a", kind: "activity", name: "Yoga al amanecer", starts_at: "2027-01-17T15:15:00.000Z", ends_at: "2027-01-17T16:15:00.000Z", location: "Muelle", capacity: 2 },
    ];
    const res = (name: string, activity: string, status: "confirmed" | "waitlisted"): ReservationSource => ({
      status,
      reserved_at: "2027-01-12T18:00:00.000Z",
      activity_id: activity,
      conference_id: null,
      profiles: { full_name: name, email: `${name}@correo.mx`, phone: null },
      tickets: { attendee_name: name, public_code: "GL-AAAAA-00000", wristband_delivered_at: null },
    });
    const rosters = toClassRosters(sessions, [res("Zoe", "a", "confirmed"), res("Ana", "a", "confirmed"), res("Luis", "a", "waitlisted")], "America/Mazatlan");
    expect(rosters.map((r) => r.name)).toEqual(["Yoga al amanecer", "Baño de sonido"]);
    expect(rosters[0].confirmed.map((r) => r.name)).toEqual(["Ana", "Zoe"]);
    expect(rosters[0].waitlisted.map((r) => r.name)).toEqual(["Luis"]);
    expect(rosters[0].when).toContain("08:15");
    expect(rosters[1].confirmed).toEqual([]);
  });

  it("nombre de archivo sin acentos ni espacios", () => {
    expect(exportFileName("Asistencia Baño de sonido", "pdf", new Date("2027-01-17T12:00:00Z"))).toBe("asistencia-bano-de-sonido-2027-01-17.pdf");
  });

  it("genera Excel y PDF válidos", async () => {
    const rows = toParticipantRows([ticket("José Ñúñez"), ticket("Ana")]);
    const xlsx = await participantsWorkbook(rows);
    expect(xlsx.subarray(0, 2).toString()).toBe("PK");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(xlsx as unknown as ArrayBuffer);
    const ws = wb.getWorksheet("Participantes")!;
    expect(ws.getRow(1).getCell(1).value).toBe("Nombre");
    expect(ws.getRow(2).getCell(1).value).toBe("Ana");
    expect(ws.getRow(3).getCell(1).value).toBe("José Ñúñez");
    expect(ws.getRow(2).getCell(9).value).toBe("Pendiente");

    expect(participantsPdf(rows).subarray(0, 4).toString()).toBe("%PDF");
    const sessions: SessionSource[] = [
      { id: "a", kind: "activity", name: "Yoga: al amanecer / muelle", starts_at: "2027-01-17T15:15:00.000Z", ends_at: "2027-01-17T16:15:00.000Z", location: "Muelle", capacity: 5 },
    ];
    const rosters = toClassRosters(sessions, []);
    expect(classesPdf(rosters).subarray(0, 4).toString()).toBe("%PDF");
    const classes = new ExcelJS.Workbook();
    await classes.xlsx.load((await classesWorkbook(rosters)) as unknown as ArrayBuffer);
    expect(classes.worksheets.map((w) => w.name)).toEqual(["Resumen", "Yoga  al amanecer   muelle".replace(/\s+/g, " ")]);
  });
});
