import type { SessionCardData } from "@/components/site/blocks";
import type { ActivityRow, ConferenceRow, SessionAvailability } from "@/lib/types";
import { dayKey } from "@/lib/format";

export function activityToCard(a: ActivityRow, avail: SessionAvailability | null, timezone: string): SessionCardData {
  const c = avail?.activities[a.id];
  return {
    kind: "activity",
    title: a.name,
    category: a.category,
    person: a.instructor || undefined,
    description: a.description,
    startsAt: a.starts_at,
    endsAt: a.ends_at,
    location: a.location,
    status: a.status,
    capacity: a.capacity,
    confirmed: c?.confirmed ?? 0,
    waitlisted: c?.waitlisted ?? 0,
    requiresReservation: true,
    timezone,
  };
}

export function conferenceToCard(cf: ConferenceRow, avail: SessionAvailability | null, timezone: string): SessionCardData {
  const c = avail?.conferences[cf.id];
  return {
    kind: "conference",
    title: cf.title,
    person: cf.speaker_name || undefined,
    description: cf.description,
    startsAt: cf.starts_at,
    endsAt: cf.ends_at,
    location: cf.location,
    status: cf.status,
    capacity: cf.capacity,
    confirmed: c?.confirmed ?? 0,
    waitlisted: c?.waitlisted ?? 0,
    requiresReservation: cf.requires_reservation,
    timezone,
  };
}

/** Agrupa elementos por día local del evento, ordenados cronológicamente. */
export function groupByDay<T>(items: T[], getStart: (item: T) => string, timezone: string) {
  const groups = new Map<string, T[]>();
  for (const item of [...items].sort((a, b) => getStart(a).localeCompare(getStart(b)))) {
    const key = dayKey(getStart(item), timezone);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()];
}
