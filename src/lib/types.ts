/** Tipos de dominio compartidos (reflejan las tablas de supabase/migrations). */
import type { StaffRole } from "@/lib/auth/permissions";

export type EventSettings = {
  is_demo?: boolean;
  online_sales_enabled?: boolean;
  reservations_open?: boolean;
  max_reservations_per_ticket?: number | null;
  contact_email?: string;
  contact_whatsapp?: string;
  instagram_url?: string;
  hero_tagline?: string;
};

export type EventRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  location_name: string;
  address: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  max_capacity: number;
  status: "draft" | "published" | "closed" | "archived";
  settings: EventSettings;
};

export type TicketSaleStatus = "draft" | "on_sale" | "box_office_only" | "paused" | "closed";

export type TicketTypeRow = {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  quantity_total: number;
  max_per_order: number;
  benefits: string[];
  access_areas: string[];
  sale_status: TicketSaleStatus;
  sales_start_at: string | null;
  sales_end_at: string | null;
  sort_order: number;
};

export type TicketAvailability = {
  ticket_type_id: string;
  quantity_total: number;
  issued: number;
  held: number;
  available: number;
};

export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type TicketStatus = "pending_payment" | "valid" | "checked_in" | "cancelled" | "refunded";

export type SessionStatus = "draft" | "published" | "closed" | "cancelled";

export type ActivityRow = {
  id: string;
  event_id: string;
  name: string;
  category: string;
  description: string;
  instructor: string;
  instructor_bio: string;
  starts_at: string;
  ends_at: string;
  location: string;
  capacity: number;
  status: SessionStatus;
  requires_ticket: boolean;
  waitlist_enabled: boolean;
  cancellation_cutoff_minutes: number;
  image_url: string | null;
};

export type ConferenceRow = {
  id: string;
  event_id: string;
  title: string;
  description: string;
  speaker_name: string;
  speaker_bio: string;
  speaker_photo_url: string | null;
  starts_at: string;
  ends_at: string;
  location: string;
  capacity: number;
  requires_reservation: boolean;
  requires_ticket: boolean;
  waitlist_enabled: boolean;
  cancellation_cutoff_minutes: number;
  status: SessionStatus;
};

export type SessionCounts = { capacity: number; confirmed: number; waitlisted: number };
export type SessionAvailability = {
  activities: Record<string, SessionCounts>;
  conferences: Record<string, SessionCounts>;
};

export type ReservationStatus = "confirmed" | "waitlisted" | "cancelled";

export type SponsorRow = {
  id: string;
  event_id: string;
  name: string;
  tier: string;
  description: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  is_published: boolean;
};

export type ExhibitorRow = {
  id: string;
  event_id: string;
  name: string;
  category: string;
  description: string;
  logo_url: string | null;
  website_url: string | null;
  booth: string | null;
  sort_order: number;
  is_published: boolean;
};

export type FaqRow = { id: string; question: string; answer: string; sort_order: number; is_published: boolean };
export type AnnouncementRow = { id: string; title: string; body: string; is_published: boolean; created_at: string };

export type StaffRow = {
  id: string;
  user_id: string;
  event_id: string | null;
  role: StaffRole;
  permissions: string[];
  is_active: boolean;
};

export type CheckInResult =
  | "accepted"
  | "already_used"
  | "invalid"
  | "payment_pending"
  | "cancelled"
  | "refunded"
  | "wrong_event"
  | "not_allowed";

export type IncidentCategory =
  | "capacity_full"
  | "exceptional_access"
  | "payment_issue"
  | "ticket_error"
  | "reservation_change"
  | "duplicate_registration"
  | "other";
export type IncidentPriority = "low" | "medium" | "high" | "urgent";
export type IncidentStatus = "open" | "in_progress" | "resolved" | "closed";
