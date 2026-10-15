import Link from "next/link";
import { AlertTriangle, FileDown, Pencil, Plus, Users } from "lucide-react";
import { AdminHeader, Panel, Pill, TableWrap } from "@/components/admin/ui";
import { SessionForm, type SessionFormValues } from "@/components/admin/session-form";
import { CancelSessionButton } from "@/components/admin/row-actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRpc } from "@/lib/db/server-rpc";
import { formatDateTime, formatTimeRange, utcToZonedLocal } from "@/lib/format";
import type { ActivityRow, ConferenceRow, EventRow, SessionAvailability } from "@/lib/types";

const STATUS: Record<string, { label: string; tone: "green" | "gray" | "amber" | "red" }> = {
  draft: { label: "Borrador", tone: "gray" },
  published: { label: "Publicada", tone: "green" },
  closed: { label: "Reservas cerradas", tone: "amber" },
  cancelled: { label: "Cancelada", tone: "red" },
};

type Row = { id: string; title: string; person: string; location: string; starts_at: string; ends_at: string; capacity: number; status: string; requiresReservation: boolean };

/** Página compartida de administración para clases y conferencias. */
export async function SessionsAdmin({
  kind,
  event,
  sp,
  canExport = false,
}: {
  kind: "activity" | "conference";
  event: EventRow;
  sp: Record<string, string | string[] | undefined>;
  canExport?: boolean;
}) {
  const admin = createAdminClient();
  const base = kind === "activity" ? "/admin/actividades" : "/admin/conferencias";
  const [{ data }, avail] = await Promise.all([
    admin.from(kind === "activity" ? "activities" : "conferences").select("*").eq("event_id", event.id).order("starts_at"),
    getRpc().call<SessionAvailability>("get_session_availability", { p_event_id: event.id }),
  ]);
  const rows: Row[] =
    kind === "activity"
      ? ((data ?? []) as ActivityRow[]).map((a) => ({ id: a.id, title: a.name, person: a.instructor, location: a.location, starts_at: a.starts_at, ends_at: a.ends_at, capacity: a.capacity, status: a.status, requiresReservation: true }))
      : ((data ?? []) as ConferenceRow[]).map((c) => ({ id: c.id, title: c.title, person: c.speaker_name, location: c.location, starts_at: c.starts_at, ends_at: c.ends_at, capacity: c.capacity, status: c.status, requiresReservation: c.requires_reservation }));
  const counts = kind === "activity" ? avail.activities : avail.conferences;

  // Conflictos: misma ubicación con horarios traslapados.
  const conflicts = new Set<string>();
  const active = rows.filter((r) => r.status !== "cancelled" && r.location);
  for (const a of active)
    for (const b of active)
      if (a.id < b.id && a.location === b.location && a.starts_at < b.ends_at && b.starts_at < a.ends_at) {
        conflicts.add(a.id);
        conflicts.add(b.id);
      }

  const editId = typeof sp.editar === "string" ? sp.editar : undefined;
  const creating = sp.nuevo === "1";
  const editing = editId ? (data ?? []).find((r) => r.id === editId) : undefined;
  const tz = event.timezone;
  const formValues: SessionFormValues | null = editing
    ? kind === "activity"
      ? (() => {
          const a = editing as ActivityRow;
          return { id: a.id, title: a.name, category: a.category, person: a.instructor, personBio: a.instructor_bio, imageUrl: a.image_url ?? "", description: a.description, startsAt: utcToZonedLocal(a.starts_at, tz), endsAt: utcToZonedLocal(a.ends_at, tz), location: a.location, capacity: a.capacity, status: a.status, requiresTicket: a.requires_ticket, requiresReservation: true, waitlistEnabled: a.waitlist_enabled, cancellationCutoffMinutes: a.cancellation_cutoff_minutes };
        })()
      : (() => {
          const c = editing as ConferenceRow;
          return { id: c.id, title: c.title, person: c.speaker_name, personBio: c.speaker_bio, imageUrl: c.speaker_photo_url ?? "", description: c.description, startsAt: utcToZonedLocal(c.starts_at, tz), endsAt: utcToZonedLocal(c.ends_at, tz), location: c.location, capacity: c.capacity, status: c.status, requiresTicket: c.requires_ticket, requiresReservation: c.requires_reservation, waitlistEnabled: c.waitlist_enabled, cancellationCutoffMinutes: c.cancellation_cutoff_minutes };
        })()
    : creating
      ? { title: "", category: "Yoga", person: "", personBio: "", imageUrl: "", description: "", startsAt: utcToZonedLocal(event.starts_at, tz), endsAt: utcToZonedLocal(new Date(new Date(event.starts_at).getTime() + 3600_000).toISOString(), tz), location: "", capacity: 30, status: "draft", requiresTicket: true, requiresReservation: kind === "activity", waitlistEnabled: false, cancellationCutoffMinutes: 60 }
      : null;

  const title = kind === "activity" ? "Clases y talleres" : "Conferencias";
  return (
    <>
      <AdminHeader
        title={title}
        description="Horarios en hora de Los Mochis. Los cupos de sesiones son independientes del inventario de entradas."
        actions={
          <Button asChild className="rounded-full">
            <Link href={`${base}?nuevo=1`}>
              <Plus /> Nueva {kind === "activity" ? "clase" : "conferencia"}
            </Link>
          </Button>
        }
      />
      {sp.guardado === "1" && <p className="mb-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">Cambios guardados.</p>}
      {typeof sp.aviso === "string" && (
        <p className="mb-4 flex items-start gap-2 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {sp.aviso}
        </p>
      )}
      {formValues && (
        <Panel title={formValues.id ? `Editar: ${formValues.title}` : "Nueva sesión"} className="mb-6">
          <SessionForm kind={kind} values={formValues} cancelHref={base} />
          {formValues.id && editing?.status !== "cancelled" && (
            <div className="mt-6 border-t border-border pt-4">
              <CancelSessionButton kind={kind} sessionId={formValues.id} />
            </div>
          )}
        </Panel>
      )}
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sesión</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Ocupación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Aún no hay sesiones.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => {
              const c = counts[r.id] ?? { confirmed: 0, waitlisted: 0, capacity: r.capacity };
              const over = c.confirmed > r.capacity;
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{[r.person, r.location].filter(Boolean).join(" · ")}</p>
                    {conflicts.has(r.id) && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-warning">
                        <AlertTriangle className="size-3" /> Traslape de horario en la misma ubicación
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDateTime(r.starts_at, tz)}
                    <p className="text-muted-foreground">{formatTimeRange(r.starts_at, r.ends_at, tz)}</p>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {r.requiresReservation ? (
                      <>
                        <span className={over ? "font-medium text-destructive" : ""}>
                          {c.confirmed}/{r.capacity}
                        </span>
                        {c.waitlisted > 0 && <span className="text-xs text-muted-foreground"> · {c.waitlisted} en espera</span>}
                        {over && <p className="text-xs text-destructive">Sobrecupo</p>}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Acceso libre · aforo {r.capacity}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {r.requiresReservation && canExport && (
                      <Button asChild size="icon-sm" variant="ghost" aria-label="Lista de asistentes en PDF">
                        <a href={`/admin/exportar/clases?formato=pdf&${kind === "activity" ? "actividad" : "conferencia"}=${r.id}`} download>
                          <FileDown />
                        </a>
                      </Button>
                    )}
                    {r.requiresReservation && (
                      <Button asChild size="icon-sm" variant="ghost" aria-label="Ver reservas">
                        <Link href={`/admin/reservas?${kind === "activity" ? "actividad" : "conferencia"}=${r.id}`}>
                          <Users />
                        </Link>
                      </Button>
                    )}
                    <Button asChild size="icon-sm" variant="ghost" aria-label="Editar">
                      <Link href={`${base}?editar=${r.id}`}>
                        <Pencil />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
    </>
  );
}
