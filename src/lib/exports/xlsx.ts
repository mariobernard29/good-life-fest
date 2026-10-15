import ExcelJS from "exceljs";
import type { ClassRoster, ParticipantRow, RosterRow } from "@/lib/exports/rows";

type Column<T> = { header: string; key: keyof T & string; width: number };

const OLIVE = "FF4F5B36";

function addTable<T extends Record<string, unknown>>(ws: ExcelJS.Worksheet, columns: Column<T>[], rows: T[], startRow = 1) {
  const header = ws.getRow(startRow);
  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width;
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: OLIVE } };
  });
  rows.forEach((r, ri) => {
    const row = ws.getRow(startRow + 1 + ri);
    columns.forEach((c, ci) => {
      row.getCell(ci + 1).value = (r[c.key] ?? "") as ExcelJS.CellValue;
    });
  });
  ws.autoFilter = { from: { row: startRow, column: 1 }, to: { row: startRow, column: columns.length } };
  ws.views = [{ state: "frozen", ySplit: startRow }];
}

const PARTICIPANT_COLUMNS: Column<ParticipantRow>[] = [
  { header: "Nombre", key: "name", width: 32 },
  { header: "Correo", key: "email", width: 34 },
  { header: "Teléfono", key: "phone", width: 16 },
  { header: "Edad", key: "age", width: 7 },
  { header: "Tipo de entrada", key: "ticketType", width: 18 },
  { header: "Código", key: "code", width: 17 },
  { header: "Cómo compró", key: "saleSource", width: 14 },
  { header: "Pago", key: "payment", width: 18 },
  { header: "Pulsera", key: "wristband", width: 11 },
  { header: "Cuenta", key: "account", width: 12 },
  { header: "Boleto", key: "ticketStatus", width: 14 },
  { header: "Registro", key: "registeredAt", width: 20 },
  { header: "Check-in", key: "checkedInAt", width: 20 },
];

const ROSTER_COLUMNS: Column<RosterRow & { n: number }>[] = [
  { header: "#", key: "n", width: 5 },
  { header: "Nombre", key: "name", width: 32 },
  { header: "Correo", key: "email", width: 34 },
  { header: "Teléfono", key: "phone", width: 16 },
  { header: "Código", key: "code", width: 17 },
  { header: "Pulsera", key: "wristband", width: 11 },
  { header: "Reserva", key: "status", width: 15 },
  { header: "Reservó", key: "reservedAt", width: 20 },
];

function workbook(title: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Good Life Wellness Fest";
  wb.title = title;
  wb.created = new Date();
  return wb;
}

export async function participantsWorkbook(rows: ParticipantRow[]): Promise<Buffer> {
  const wb = workbook("Participantes");
  addTable(wb.addWorksheet("Participantes"), PARTICIPANT_COLUMNS, rows);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Nombres de hoja: máx. 31 caracteres, sin []:*?/\ y únicos. */
function sheetName(name: string, used: Set<string>) {
  const base = name.replace(/[[\]:*?/\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 28) || "Sesión";
  let candidate = base;
  for (let i = 2; used.has(candidate.toLowerCase()); i++) candidate = `${base.slice(0, 26)} ${i}`;
  used.add(candidate.toLowerCase());
  return candidate;
}

export async function classesWorkbook(rosters: ClassRoster[]): Promise<Buffer> {
  const wb = workbook("Clases y actividades");
  const summary = wb.addWorksheet("Resumen");
  addTable(
    summary,
    [
      { header: "Clase / actividad", key: "name", width: 34 },
      { header: "Horario", key: "when", width: 36 },
      { header: "Lugar", key: "location", width: 20 },
      { header: "Cupo", key: "capacity", width: 8 },
      { header: "Confirmadas", key: "confirmed", width: 12 },
      { header: "Lista de espera", key: "waitlisted", width: 14 },
    ],
    rosters.map((r) => ({ name: r.name, when: r.when, location: r.location, capacity: r.capacity, confirmed: r.confirmed.length, waitlisted: r.waitlisted.length })),
  );

  const used = new Set(["resumen"]);
  for (const r of rosters) {
    const ws = wb.addWorksheet(sheetName(r.name, used));
    ws.getCell("A1").value = r.name;
    ws.getCell("A1").font = { bold: true, size: 14 };
    ws.getCell("A2").value = `${r.when}${r.location ? ` · ${r.location}` : ""} · ${r.confirmed.length}/${r.capacity} confirmadas`;
    const people = [...r.confirmed, ...r.waitlisted].map((p, i) => ({ ...p, n: i + 1 }));
    addTable(ws, ROSTER_COLUMNS, people, 4);
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
