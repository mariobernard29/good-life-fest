import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { ClassRoster, ParticipantRow, RosterRow } from "@/lib/exports/rows";
import { formatDateTime } from "@/lib/format";

const OLIVE: [number, number, number] = [79, 91, 54];
const MARGIN = 40;

/** Las fuentes estándar de PDF usan WinAnsi: se normalizan espacios especiales de Intl. */
const clean = (s: string) => s.replace(/[  ]/g, " ");

function newDoc(title: string, subtitle: string) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  doc.setProperties({ title, creator: "Good Life Wellness Fest" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(clean(title), MARGIN, 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(clean(subtitle), MARGIN, 74);
  doc.setTextColor(0);
  return doc;
}

function footer(doc: jsPDF, generatedAt: string) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(130);
    const h = doc.internal.pageSize.getHeight();
    const w = doc.internal.pageSize.getWidth();
    doc.text(clean(`Good Life Wellness Fest · generado ${generatedAt}`), MARGIN, h - 24);
    doc.text(`Página ${i} de ${pages}`, w - MARGIN, h - 24, { align: "right" });
  }
}

function peopleTable(doc: jsPDF, rows: RosterRow[] | ParticipantRow[], startY: number) {
  autoTable(doc, {
    startY,
    margin: { left: MARGIN, right: MARGIN, bottom: 48 },
    head: [["#", "Nombre", "Correo", "Pulsera"]],
    body: rows.map((r, i) => [String(i + 1), clean(r.name), r.email, r.wristband]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 5, overflow: "linebreak" },
    headStyles: { fillColor: OLIVE, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 243, 236] },
    columnStyles: { 0: { cellWidth: 28, halign: "right" }, 3: { cellWidth: 70 } },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        data.cell.styles.textColor = data.cell.raw === "Pendiente" ? [183, 121, 31] : [47, 107, 69];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

/** Participantes en orden alfabético: nombre, correo y si su pulsera se entregó. */
export function participantsPdf(rows: ParticipantRow[], tz?: string): Buffer {
  const generatedAt = formatDateTime(new Date(), tz);
  const delivered = rows.filter((r) => r.wristband === "Entregada").length;
  const doc = newDoc(
    "Participantes registrados",
    `${rows.length} personas · pulseras entregadas: ${delivered} · pendientes: ${rows.length - delivered}`,
  );
  peopleTable(doc, rows, 92);
  footer(doc, generatedAt);
  return Buffer.from(doc.output("arraybuffer"));
}

/** Una sección por clase/actividad (en orden de horario) con sus personas en orden alfabético. */
export function classesPdf(rosters: ClassRoster[], tz?: string): Buffer {
  const generatedAt = formatDateTime(new Date(), tz);
  const total = rosters.reduce((n, r) => n + r.confirmed.length, 0);
  const doc = newDoc("Asistencia por clase y actividad", `${rosters.length} sesiones · ${total} reservas confirmadas`);
  let y = 100;
  rosters.forEach((r, i) => {
    if (i > 0) {
      doc.addPage();
      y = 56;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(clean(r.name), MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(clean(`${r.when}${r.location ? ` · ${r.location}` : ""} · ${r.confirmed.length}/${r.capacity} confirmadas`), MARGIN, y + 15);
    doc.setTextColor(0);
    if (r.confirmed.length === 0 && r.waitlisted.length === 0) {
      doc.setFontSize(10);
      doc.text("Sin reservas.", MARGIN, y + 40);
      return;
    }
    const end = r.confirmed.length ? peopleTable(doc, r.confirmed, y + 26) : y + 26;
    if (r.waitlisted.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Lista de espera (${r.waitlisted.length})`, MARGIN, end + 22);
      doc.setFont("helvetica", "normal");
      peopleTable(doc, r.waitlisted, end + 30);
    }
  });
  footer(doc, generatedAt);
  return Buffer.from(doc.output("arraybuffer"));
}
