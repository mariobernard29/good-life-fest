"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Clock4, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SessionCard, type SessionCardData } from "@/components/site/blocks";
import { cancelReservationAction, reserveAction } from "@/app/mi-cuenta/actions";

export type BookableSession = SessionCardData & {
  id: string;
  myReservation: { id: string; status: "confirmed" | "waitlisted"; ticketId: string | null } | null;
  waitlistEnabled: boolean;
  started: boolean;
};

type TicketChoice = { id: string; label: string };

export function BookingList({ sessions, tickets }: { sessions: BookableSession[]; tickets: TicketChoice[] }) {
  const [ticketId, setTicketId] = useState<string | null>(tickets[0]?.id ?? null);

  return (
    <div className="space-y-6">
      {tickets.length > 1 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <label htmlFor="ticket" className="text-sm font-medium">
            Reservar con el boleto de:
          </label>
          <select
            id="ticket"
            className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
            value={ticketId ?? ""}
            onChange={(e) => setTicketId(e.target.value)}
          >
            {tickets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted-foreground">Cada boleto (asistente) tiene sus propias reservas.</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {sessions.map((s) => (
          <BookableCard key={s.id} s={s} ticketId={ticketId} hasTickets={tickets.length > 0} />
        ))}
      </div>
    </div>
  );
}

type Optimistic = { reservation: BookableSession["myReservation"]; confirmed: number };

function BookableCard({ s, ticketId, hasTickets }: { s: BookableSession; ticketId: string | null; hasTickets: boolean }) {
  const [pending, start] = useTransition();
  const mine = s.myReservation && (s.myReservation.ticketId === ticketId || s.myReservation.ticketId === null) ? s.myReservation : null;
  const [optimistic, setOptimistic] = useOptimistic<Optimistic, Optimistic>({ reservation: mine, confirmed: s.confirmed }, (_, next) => next);
  const full = optimistic.confirmed >= s.capacity;

  function reserve() {
    start(async () => {
      setOptimistic({ reservation: { id: "temp", status: full ? "waitlisted" : "confirmed", ticketId }, confirmed: full ? optimistic.confirmed : optimistic.confirmed + 1 });
      const res = await reserveAction({ kind: s.kind, sessionId: s.id, ticketId });
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  function cancel() {
    if (!optimistic.reservation || optimistic.reservation.id === "temp") return;
    const reservationId = optimistic.reservation.id;
    const wasConfirmed = optimistic.reservation.status === "confirmed";
    start(async () => {
      setOptimistic({ reservation: null, confirmed: wasConfirmed ? optimistic.confirmed - 1 : optimistic.confirmed });
      const res = await cancelReservationAction({ reservationId });
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  let footer: React.ReactNode;
  if (optimistic.reservation) {
    const waiting = optimistic.reservation.status === "waitlisted";
    footer = (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/70 px-3 py-2">
        <span className={waiting ? "flex items-center gap-1.5 text-sm text-warning" : "flex items-center gap-1.5 text-sm text-success"}>
          {waiting ? <Clock4 className="size-4" /> : <CheckCircle2 className="size-4" />}
          {waiting ? "En lista de espera" : "Reservado"}
        </span>
        <Button size="sm" variant="ghost" onClick={cancel} disabled={pending} className="text-destructive">
          {pending ? <Loader2 className="animate-spin" /> : <X />} Cancelar
        </Button>
      </div>
    );
  } else if (!hasTickets) {
    footer = (
      <Button asChild variant="outline" className="w-full rounded-full">
        <Link href="/entradas">Necesitas una entrada</Link>
      </Button>
    );
  } else if (s.status !== "published" || s.started) {
    footer = (
      <Button disabled variant="outline" className="w-full rounded-full">
        {s.started ? "Ya comenzó" : "Reservas cerradas"}
      </Button>
    );
  } else if (full && !s.waitlistEnabled) {
    footer = (
      <Button disabled variant="outline" className="w-full rounded-full">
        Cupo lleno
      </Button>
    );
  } else {
    footer = (
      <Button onClick={reserve} disabled={pending} className="h-11 w-full rounded-full" variant={full ? "outline" : "default"}>
        {pending && <Loader2 className="animate-spin" />}
        {full ? "Unirme a la lista de espera" : "Reservar"}
      </Button>
    );
  }

  return <SessionCard s={{ ...s, confirmed: optimistic.confirmed }} footer={footer} />;
}
