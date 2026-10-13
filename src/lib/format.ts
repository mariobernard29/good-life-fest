/** Formato de moneda y fechas (es-MX, America/Mazatlan). */
export const DEFAULT_TZ = "America/Mazatlan";

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function formatMoney(cents: number, currency = "MXN"): string {
  if (currency === "MXN") return mxn.format(cents / 100);
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(cents / 100);
}

function fmt(iso: string | Date, options: Intl.DateTimeFormatOptions, tz = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("es-MX", { timeZone: tz, ...options }).format(new Date(iso));
}

export const formatDateTime = (iso: string | Date, tz?: string) =>
  fmt(iso, { dateStyle: "medium", timeStyle: "short" }, tz);
export const formatDate = (iso: string | Date, tz?: string) => fmt(iso, { dateStyle: "long" }, tz);
export const formatShortDate = (iso: string | Date, tz?: string) =>
  fmt(iso, { day: "numeric", month: "short" }, tz);
export const formatTime = (iso: string | Date, tz?: string) => fmt(iso, { hour: "2-digit", minute: "2-digit", hour12: false }, tz);
export const formatWeekday = (iso: string | Date, tz?: string) => {
  const s = fmt(iso, { weekday: "long", day: "numeric", month: "long" }, tz);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function formatTimeRange(start: string, end: string, tz?: string) {
  return `${formatTime(start, tz)} – ${formatTime(end, tz)}`;
}

export function durationMinutes(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

/** Clave de día local (YYYY-MM-DD) en la zona del evento, para agrupar agendas. */
export function dayKey(iso: string, tz = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso),
  );
}

function tzOffsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2027-03-20T08:00" (hora local del evento) -> ISO UTC. */
export function zonedLocalToUtc(local: string, tz = DEFAULT_TZ): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) throw new Error("Fecha inválida");
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let utc = guess - tzOffsetMs(new Date(guess), tz);
  const second = guess - tzOffsetMs(new Date(utc), tz);
  if (second !== utc) utc = second;
  return new Date(utc).toISOString();
}

/** ISO UTC -> "YYYY-MM-DDTHH:mm" en la zona del evento (para <input type="datetime-local">). */
export function utcToZonedLocal(iso: string | null | undefined, tz = DEFAULT_TZ): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** Hora de la solicitud en el servidor (milisegundos). */
export function requestTimeMs(): number {
  return Date.now();
}
