import type { ReactNode } from "react";
import { CalendarClock, MapPin, Sparkles, UserRound, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { durationMinutes, formatTimeRange, formatWeekday } from "@/lib/format";

export function PageHero({ eyebrow, title, children, className }: { eyebrow: string; title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={cn("container-page pt-12 pb-10 sm:pt-16", className)}>
      <p className="eyebrow fade-up">{eyebrow}</p>
      <h1 className="display fade-up mt-3 max-w-3xl text-5xl text-balance sm:text-6xl">{title}</h1>
      {children && <div className="fade-up mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">{children}</div>}
    </section>
  );
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="display mt-2 text-4xl text-balance sm:text-5xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-secondary text-olive">{icon ?? <Sparkles className="size-5" />}</div>
      <p className="display text-2xl">{title}</p>
      {children && <div className="mt-2 max-w-md text-sm text-muted-foreground">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function DemoBanner() {
  return (
    <div className="bg-sunset/15 text-center text-xs text-ink/80">
      <p className="container-page py-2">
        Sitio en preparación: fechas, precios, instructores y marcas mostrados son <strong>datos de demostración</strong>.
      </p>
    </div>
  );
}

export function CapacityMeter({ capacity, confirmed, waitlisted = 0 }: { capacity: number; confirmed: number; waitlisted?: number }) {
  const left = Math.max(capacity - confirmed, 0);
  const pct = capacity > 0 ? Math.min((confirmed / capacity) * 100, 100) : 100;
  const tone = left === 0 ? "bg-destructive/70" : left <= Math.max(3, capacity * 0.15) ? "bg-sunset" : "bg-olive";
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuemin={0} aria-valuemax={capacity} aria-valuenow={confirmed} aria-label="Ocupación">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {left === 0 ? "Cupo lleno" : left === 1 ? "Queda 1 lugar" : `Quedan ${left} lugares`}
        {waitlisted > 0 && ` · ${waitlisted} en lista de espera`}
      </p>
    </div>
  );
}

export type SessionCardData = {
  kind: "activity" | "conference";
  title: string;
  category?: string;
  person?: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  location: string;
  status: string;
  capacity: number;
  confirmed: number;
  waitlisted: number;
  requiresReservation: boolean;
  timezone: string;
};

export function SessionCard({ s, footer }: { s: SessionCardData; footer?: ReactNode }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-[0_1px_0_rgba(30,35,28,0.03)] transition-shadow hover:shadow-[0_12px_32px_-18px_rgba(30,35,28,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <Badge variant="secondary" className="rounded-full bg-accent font-medium text-olive">
          {s.kind === "conference" ? "Conferencia" : (s.category ?? "Clase")}
        </Badge>
        {s.status === "cancelled" && <Badge variant="destructive">Cancelada</Badge>}
        {s.status === "closed" && <Badge variant="outline">Reservas cerradas</Badge>}
      </div>
      <h3 className="display mt-4 text-2xl leading-tight">{s.title}</h3>
      {s.person && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <UserRound className="size-3.5" /> {s.person}
        </p>
      )}
      {s.description && <p className="mt-3 line-clamp-3 text-sm text-foreground/75">{s.description}</p>}
      <dl className="mt-4 space-y-1.5 text-sm text-foreground/80">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-olive" />
          <dt className="sr-only">Horario</dt>
          <dd>
            <span className="">{formatWeekday(s.startsAt, s.timezone)}</span> · {formatTimeRange(s.startsAt, s.endsAt, s.timezone)}{" "}
            <span className="text-muted-foreground">({durationMinutes(s.startsAt, s.endsAt)} min)</span>
          </dd>
        </div>
        {s.location && (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-olive" />
            <dt className="sr-only">Ubicación</dt>
            <dd>{s.location}</dd>
          </div>
        )}
      </dl>
      <div className="mt-auto pt-5">
        {s.requiresReservation ? (
          <CapacityMeter capacity={s.capacity} confirmed={s.confirmed} waitlisted={s.waitlisted} />
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" /> Acceso libre con tu entrada · aforo {s.capacity}
          </p>
        )}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </article>
  );
}
