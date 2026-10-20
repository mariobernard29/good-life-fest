/**
 * Filas de exportación (funciones puras, sin acceso a datos): se prueban con
 * pruebas unitarias y las comparten el Excel y el PDF.
 */
import { SALE_SOURCE_LABEL, wristbandLabel } from "@/lib/participants/labels";
import { formatDateTime, formatTimeRange, formatWeekday } from "@/lib/format";

const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

/** Orden alfabético en español (ignora acentos y mayúsculas: «Álvaro» va antes que «Beatriz»). */
export function sortByName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => collator.compare(a.name.trim(), b.name.trim()));
}

const TICKET_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pago pendiente",
  valid: "Válido",
  checked_in: "Ingresó",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const PAYMENT_LABEL: Record<string, string> = {
  paid: "Pagado",
  awaiting_payment: "Pago por confirmar",
  pending: "Pendiente",
};

// --- Participantes ---------------------------------------------------------------
export type ParticipantSource = {
  public_code: string;
  attendee_name: string;
  attendee_email: string | null;
  status: string;
  issued_at: string;
  checked_in_at: string | null;
  wristband_delivered_at: string | null;
  ticket_types: { name: string } | null;
  profiles: { full_name: string; email: string; phone: string | null; age: number | null; activated_at: string | null } | null;
  order_items: {
    orders: { buyer_name: string; buyer_email: string; buyer_phone: string | null; status: string; channel: string; sale_source: string | null } | null;
  } | null;
};

export type ParticipantRow = {
  name: string;
  email: string;
  phone: string;
  age: number | null;
  ticketType: string;
  code: string;
  saleSource: string;
  payment: string;
  wristband: "Entregada" | "Pendiente";
  account: string;
  ticketStatus: string;
  registeredAt: string;
  checkedInAt: string;
};

export function toParticipantRows(source: ParticipantSource[], tz?: string): ParticipantRow[] {
  return sortByName(
    source.map((t) => {
      const order = t.order_items?.orders ?? null;
      return {
        name: t.attendee_name || t.profiles?.full_name || order?.buyer_name || "Sin nombre",
        email: t.profiles?.email ?? t.attendee_email ?? order?.buyer_email ?? "",
        phone: t.profiles?.phone ?? order?.buyer_phone ?? "",
        age: t.profiles?.age ?? null,
        ticketType: t.ticket_types?.name ?? "",
        code: t.public_code,
        saleSource: order?.sale_source ? SALE_SOURCE_LABEL[order.sale_source] : order?.channel === "online" ? "En línea" : "Taquilla",
        payment: order ? (PAYMENT_LABEL[order.status] ?? order.status) : "",
        wristband: wristbandLabel(t.wristband_delivered_at),
        account: t.profiles ? (t.profiles.activated_at ? "Activada" : "Sin activar") : "Sin cuenta",
        ticketStatus: TICKET_STATUS_LABEL[t.status] ?? t.status,
        registeredAt: formatDateTime(t.issued_at, tz),
        checkedInAt: t.checked_in_at ? formatDateTime(t.checked_in_at, tz) : "",
      };
    }),
  );
}

// --- Clases y actividades ----------------------------------------------------------
export type SessionSource = {
  id: string;
  kind: "activity" | "conference";
  name: string;
  starts_at: string;
  ends_at: string;
  location: string;
  capacity: number;
};

export type ReservationSource = {
  status: "confirmed" | "waitlisted";
  reserved_at: string;
  activity_id: string | null;
  conference_id: string | null;
  profiles: { full_name: string; email: string; phone: string | null } | null;
  tickets: { attendee_name: string; public_code: string; wristband_delivered_at: string | null } | null;
};

export type RosterRow = {
  name: string;
  email: string;
  phone: string;
  code: string;
  wristband: "Entregada" | "Pendiente";
  status: "Confirmada" | "Lista de espera";
  reservedAt: string;
};

export type ClassRoster = {
  id: string;
  kind: "activity" | "conference";
  name: string;
  when: string;
  location: string;
  capacity: number;
  confirmed: RosterRow[];
  waitlisted: RosterRow[];
};

/** Agrupa reservas por sesión (en orden de horario) y ordena a las personas alfabéticamente. */
export function toClassRosters(sessions: SessionSource[], reservations: ReservationSource[], tz?: string): ClassRoster[] {
  const bySession = new Map<string, ReservationSource[]>();
  for (const r of reservations) {
    const key = r.activity_id ?? r.conference_id;
    if (!key) continue;
    const list = bySession.get(key) ?? [];
    list.push(r);
    bySession.set(key, list);
  }
  return [...sessions]
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at) || collator.compare(a.name, b.name))
    .map((s) => {
      const rows = (bySession.get(s.id) ?? []).map(
        (r): RosterRow => ({
          name: r.tickets?.attendee_name || r.profiles?.full_name || "Sin nombre",
          email: r.profiles?.email ?? "",
          phone: r.profiles?.phone ?? "",
          code: r.tickets?.public_code ?? "",
          wristband: wristbandLabel(r.tickets?.wristband_delivered_at),
          status: r.status === "confirmed" ? "Confirmada" : "Lista de espera",
          reservedAt: formatDateTime(r.reserved_at, tz),
        }),
      );
      return {
        id: s.id,
        kind: s.kind,
        name: s.name,
        when: `${formatWeekday(s.starts_at, tz)} · ${formatTimeRange(s.starts_at, s.ends_at, tz)}`,
        location: s.location,
        capacity: s.capacity,
        confirmed: sortByName(rows.filter((r) => r.status === "Confirmada")),
        waitlisted: sortByName(rows.filter((r) => r.status === "Lista de espera")),
      };
    });
}

/** Nombre de archivo seguro: «participantes-2027-01-24.xlsx». */
export function exportFileName(base: string, ext: "xlsx" | "pdf", now = new Date()) {
  const slug = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "exportacion"}-${now.toISOString().slice(0, 10)}.${ext}`;
}
