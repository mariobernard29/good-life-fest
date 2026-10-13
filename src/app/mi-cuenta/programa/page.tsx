import { requestTimeMs } from "@/lib/format";
import type { Metadata } from "next";
import { EmptyState } from "@/components/site/blocks";
import { BookingList, type BookableSession } from "@/components/portal/booking";
import { getCurrentEvent, isEventPublic } from "@/lib/events/current";
import { getActivities, getConferences, getSessionAvailability } from "@/lib/events/public";
import { activityToCard, conferenceToCard } from "@/lib/events/sessions";
import { activeTickets, getMyReservations, getMyTickets } from "@/lib/portal/queries";

export const metadata: Metadata = { title: "Reservar clases y conferencias" };

export default async function PortalProgramPage({ searchParams }: PageProps<"/mi-cuenta/programa">) {
  const event = await getCurrentEvent();
  if (!isEventPublic(event)) return <EmptyState title="El programa aún no está disponible" />;
  const { tipo } = await searchParams;

  const [activities, conferences, avail, tickets, reservations] = await Promise.all([
    getActivities(event.id),
    getConferences(event.id),
    getSessionAvailability(event.id),
    getMyTickets(),
    getMyReservations(),
  ]);
  const myTickets = activeTickets(tickets).filter((t) => t.event_id === event.id);
  const now = requestTimeMs();

  const findMine = (key: "activity_id" | "conference_id", id: string) => {
    const r = reservations.find((x) => x[key] === id);
    return r ? { id: r.id, status: r.status as "confirmed" | "waitlisted", ticketId: r.ticket_id } : null;
  };

  const sessions: BookableSession[] = [
    ...activities
      .filter((a) => a.status !== "draft")
      .map((a) => ({
        ...activityToCard(a, avail, event.timezone),
        id: a.id,
        myReservation: findMine("activity_id", a.id),
        waitlistEnabled: a.waitlist_enabled,
        started: new Date(a.starts_at).getTime() <= now,
      })),
    ...conferences
      .filter((c) => c.status !== "draft" && c.requires_reservation)
      .map((c) => ({
        ...conferenceToCard(c, avail, event.timezone),
        id: c.id,
        myReservation: findMine("conference_id", c.id),
        waitlistEnabled: c.waitlist_enabled,
        started: new Date(c.starts_at).getTime() <= now,
      })),
  ]
    .filter((s) => (tipo === "conferencias" ? s.kind === "conference" : tipo === "clases" ? s.kind === "activity" : true))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Reservar</p>
        <h1 className="display mt-1 text-4xl sm:text-5xl">Clases y conferencias</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La disponibilidad se actualiza en tiempo real al reservar. Las conferencias de acceso libre no aparecen aquí: solo llega con tu entrada.
        </p>
      </div>
      <nav className="flex gap-2" aria-label="Filtrar">
        {[
          ["", "Todo"],
          ["clases", "Clases"],
          ["conferencias", "Conferencias"],
        ].map(([value, label]) => (
          <a
            key={value}
            href={value ? `?tipo=${value}` : "?"}
            className={`rounded-full border px-4 py-1.5 text-sm ${(tipo ?? "") === value ? "border-olive bg-olive text-primary-foreground" : "border-border bg-card"}`}
          >
            {label}
          </a>
        ))}
      </nav>
      {myTickets.length === 0 && (
        <p className="rounded-xl bg-sunset/15 px-4 py-3 text-sm">
          Para reservar necesitas una entrada válida vinculada a tu cuenta. Si ya compraste, verifica que usaste el mismo correo.
        </p>
      )}
      {sessions.length === 0 ? (
        <EmptyState title="No hay sesiones disponibles" />
      ) : (
        <BookingList
          sessions={sessions}
          tickets={myTickets.map((t) => ({ id: t.id, label: `${t.attendee_name || "Asistente"} · ${t.ticket_types?.name ?? ""} (${t.public_code})` }))}
        />
      )}
      <p className="text-center text-xs text-muted-foreground">
        Horarios en hora de Los Mochis (America/Mazatlan).
      </p>
    </div>
  );
}
