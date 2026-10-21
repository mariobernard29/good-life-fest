import { requestTimeMs } from "@/lib/format";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell, CalendarHeart, Sparkles, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationsPrompt } from "@/components/portal/notifications-prompt";
import { reminderMinutes } from "@/lib/push/dispatch";
import { requireUserPage } from "@/lib/auth/session";
import { getCurrentEvent, isEventPublic } from "@/lib/events/current";
import { getAnnouncements } from "@/lib/events/public";
import { activeTickets, getMyProfile, getMyReservations, getMyTickets, startOf } from "@/lib/portal/queries";
import { formatDate, formatTimeRange, formatWeekday, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function PortalHome({ searchParams }: PageProps<"/mi-cuenta">) {
  const user = await requireUserPage("/mi-cuenta");
  const { contrasena, bienvenida } = await searchParams;
  const event = await getCurrentEvent();
  const [profile, tickets, reservations, announcements] = await Promise.all([
    getMyProfile(user.id),
    getMyTickets(),
    getMyReservations(),
    isEventPublic(event) ? getAnnouncements(event.id) : Promise.resolve([]),
  ]);
  const valid = activeTickets(tickets);
  const now = requestTimeMs();
  const upcoming = reservations.filter((r) => new Date(startOf(r)).getTime() > now).slice(0, 3);
  const firstName = (profile?.full_name || user.email).split(/\s+/)[0];

  return (
    <div className="space-y-8">
      {contrasena === "actualizada" && <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">Tu contraseña se actualizó.</p>}
      {bienvenida && <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">¡Tu cuenta quedó activada! Ya puedes apartar tu lugar en las clases.</p>}
      <section>
        <p className="eyebrow">Mi cuenta</p>
        <h1 className="display mt-1 text-5xl">Hola, {firstName}</h1>
        {event && (
          <p className="mt-2 text-muted-foreground">
            {event.name} · {formatDate(event.starts_at, event.timezone)}
          </p>
        )}
      </section>

      <NotificationsPrompt reminderMinutes={reminderMinutes(event?.settings)} highlight={Boolean(bienvenida)} />

      {/* Acceso rápido al boleto virtual */}
      <Link
        href="/mi-cuenta/entradas"
        className="group flex items-center justify-between gap-4 rounded-3xl bg-ink p-6 text-cream transition-transform active:scale-[0.99]"
      >
        <div>
          <p className="text-xs tracking-[0.25em] text-cream/60 uppercase">Tus entradas</p>
          <p className="display mt-1 text-3xl">
            {valid.length === 0 ? "Sin entradas activas" : valid.length === 1 ? "1 entrada activa" : `${valid.length} entradas activas`}
          </p>
          <p className="mt-1 text-sm text-cream/70">{valid.length ? "Toca para ver tu boleto virtual" : "Aún no tienes entrada en esta cuenta"}</p>
        </div>
        <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-cream text-ink">
          <Ticket className="size-8" />
        </div>
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="display flex items-center gap-2 text-2xl">
              <CalendarHeart className="size-5 text-olive" /> Próximas actividades
            </h2>
            <Button asChild variant="link" size="sm" className="text-olive">
              <Link href="/mi-cuenta/reservas">
                Ver agenda <ArrowRight />
              </Link>
            </Button>
          </div>
          {upcoming.length === 0 ? (
            <div className="rounded-2xl bg-secondary/60 p-5 text-sm">
              <p>No tienes reservas próximas.</p>
              <Button asChild size="sm" className="mt-3 rounded-full">
                <Link href="/mi-cuenta/programa">
                  <Sparkles /> Reservar clases
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((r) => {
                const s = r.activities ?? r.conferences!;
                return (
                  <li key={r.id} className="rounded-2xl bg-secondary/50 p-4">
                    <p className="font-medium">{r.activities?.name ?? r.conferences?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="">{formatWeekday(s.starts_at)}</span> · {formatTimeRange(s.starts_at, s.ends_at)} · {s.location}
                    </p>
                    {r.status === "waitlisted" && <p className="text-xs font-medium text-warning">En lista de espera</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-5">
          <h2 className="display mb-4 flex items-center gap-2 text-2xl">
            <Bell className="size-5 text-olive" /> Avisos del festival
          </h2>
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin avisos por ahora.</p>
          ) : (
            <ul className="space-y-4">
              {announcements.map((a) => (
                <li key={a.id}>
                  <p className="font-medium">{a.title}</p>
                  {a.body && <p className="text-sm text-foreground/75">{a.body}</p>}
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
