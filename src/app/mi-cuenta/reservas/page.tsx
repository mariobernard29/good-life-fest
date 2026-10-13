import { requestTimeMs } from "@/lib/format";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarHeart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/site/blocks";
import { CancelReservationButton } from "@/components/portal/reservation-row";
import { getMyReservations, startOf } from "@/lib/portal/queries";
import { groupByDay } from "@/lib/events/sessions";
import { DEFAULT_TZ, formatTimeRange, formatWeekday } from "@/lib/format";

export const metadata: Metadata = { title: "Mi agenda" };

export default async function MyReservationsPage() {
  const reservations = await getMyReservations();
  const days = groupByDay(reservations, startOf, DEFAULT_TZ);
  const now = requestTimeMs();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Mi agenda</p>
        <h1 className="display mt-1 text-4xl sm:text-5xl">Tus reservas</h1>
      </div>
      {reservations.length === 0 ? (
        <EmptyState
          icon={<CalendarHeart className="size-5" />}
          title="Aún no tienes reservas"
          action={
            <Button asChild className="rounded-full">
              <Link href="/mi-cuenta/programa">Explorar clases</Link>
            </Button>
          }
        >
          Reserva tus clases favoritas: los cupos son limitados.
        </EmptyState>
      ) : (
        days.map(([day, list]) => (
          <section key={day}>
            <h2 className="display mb-3 text-3xl">{formatWeekday(startOf(list[0]))}</h2>
            <ul className="space-y-3">
              {list.map((r) => {
                const s = r.activities ?? r.conferences!;
                const title = r.activities?.name ?? r.conferences?.title ?? "";
                const person = r.activities?.instructor ?? r.conferences?.speaker_name ?? "";
                const cutoff = new Date(s.starts_at).getTime() - s.cancellation_cutoff_minutes * 60_000;
                const closed = r.status === "confirmed" && now > cutoff;
                return (
                  <li key={r.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-4">
                      <div className="w-16 shrink-0 font-mono text-sm text-muted-foreground tabular-nums">{formatTimeRange(s.starts_at, s.ends_at).split(" – ")[0]}</div>
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-sm text-muted-foreground">
                          {person} · {formatTimeRange(s.starts_at, s.ends_at)}
                        </p>
                        {s.location && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" /> {s.location}
                          </p>
                        )}
                        <p className={`mt-1 text-xs font-medium ${r.status === "waitlisted" ? "text-warning" : "text-success"}`}>
                          {r.status === "waitlisted" ? "En lista de espera · te avisamos al liberarse un lugar" : "Confirmada"}
                        </p>
                        {s.status === "cancelled" && <p className="text-xs font-medium text-destructive">Sesión cancelada por el festival</p>}
                      </div>
                    </div>
                    <CancelReservationButton
                      reservationId={r.id}
                      disabledReason={closed ? `Cancelación cerrada (${s.cancellation_cutoff_minutes} min antes)` : undefined}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
