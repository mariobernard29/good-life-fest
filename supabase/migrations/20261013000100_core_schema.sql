-- =============================================================================
-- Good Life Wellness Fest — esquema principal
-- Convenciones:
--   * Importes en centavos enteros (MXN).
--   * Marcas de tiempo en timestamptz (UTC); la zona de visualización vive en events.timezone.
--   * Las operaciones críticas (inventario, emisión, reservas, check-in) se hacen
--     exclusivamente mediante funciones de la migración 0300.
-- =============================================================================

create schema if not exists private;

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------
create type public.event_status as enum ('draft', 'published', 'closed', 'archived');

-- on_sale: venta web y taquilla · box_office_only: solo taquilla
-- paused: visible pero sin venta · draft/closed: no vendible
create type public.ticket_sale_status as enum ('draft', 'on_sale', 'box_office_only', 'paused', 'closed');

create type public.order_status as enum (
  'pending',            -- retención de inventario activa mientras expires_at > now()
  'awaiting_payment',   -- venta física con pago por confirmar (p. ej. transferencia)
  'paid',
  'failed',
  'expired',
  'cancelled',
  'refunded',
  'partially_refunded'
);

create type public.order_channel as enum ('online', 'box_office', 'complimentary');

create type public.payment_method as enum ('stripe', 'cash', 'card_terminal', 'transfer', 'complimentary');

create type public.ticket_status as enum ('pending_payment', 'valid', 'checked_in', 'cancelled', 'refunded');

create type public.session_status as enum ('draft', 'published', 'closed', 'cancelled');

create type public.reservation_status as enum ('confirmed', 'waitlisted', 'cancelled');

create type public.staff_role as enum ('super_admin', 'event_admin', 'ticketing_staff', 'checkin_staff');

create type public.check_in_result as enum (
  'accepted', 'already_used', 'invalid', 'payment_pending', 'cancelled', 'refunded', 'wrong_event', 'not_allowed'
);

create type public.incident_category as enum (
  'capacity_full', 'exceptional_access', 'payment_issue', 'ticket_error',
  'reservation_change', 'duplicate_registration', 'other'
);
create type public.incident_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.incident_status as enum ('open', 'in_progress', 'resolved', 'closed');

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  email       text not null check (char_length(email) <= 254),
  phone       text check (phone is null or char_length(phone) <= 30),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_email_idx on public.profiles (lower(email));
create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Eventos
-- -----------------------------------------------------------------------------
create table public.events (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 2 and 160),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description    text not null default '',
  location_name  text not null default '',
  address        text not null default '',
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  timezone       text not null default 'America/Mazatlan',
  max_capacity   integer not null check (max_capacity > 0),
  status         public.event_status not null default 'draft',
  -- Configuración pública y reglas de negocio configurables (ver README §Supuestos).
  settings       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint events_dates_check check (ends_at > starts_at)
);
create trigger events_updated_at before update on public.events
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tipos de entrada
-- -----------------------------------------------------------------------------
create table public.ticket_types (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events (id) on delete cascade,
  name            text not null check (char_length(name) between 2 and 120),
  description     text not null default '',
  price_cents     integer not null check (price_cents >= 0),
  currency        char(3) not null default 'MXN' check (currency = upper(currency)),
  quantity_total  integer not null check (quantity_total >= 0),
  max_per_order   integer not null default 6 check (max_per_order between 1 and 50),
  benefits        text[] not null default '{}',
  -- Zonas/accesos que habilita la entrada; el check-in valida contra esta lista.
  access_areas    text[] not null default '{general}',
  sale_status     public.ticket_sale_status not null default 'draft',
  sales_start_at  timestamptz,
  sales_end_at    timestamptz,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint ticket_types_sales_window check (sales_end_at is null or sales_start_at is null or sales_end_at > sales_start_at),
  constraint ticket_types_event_name_key unique (event_id, name)
);
create index ticket_types_event_idx on public.ticket_types (event_id, sort_order);
create trigger ticket_types_updated_at before update on public.ticket_types
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Pedidos
-- -----------------------------------------------------------------------------
create table public.orders (
  id                          uuid primary key default gen_random_uuid(),
  event_id                    uuid not null references public.events (id) on delete restrict,
  user_id                     uuid references public.profiles (id) on delete set null,
  reference                   text not null unique,
  buyer_email                 text not null check (char_length(buyer_email) <= 254),
  buyer_name                  text not null default '' check (char_length(buyer_name) <= 120),
  buyer_phone                 text check (buyer_phone is null or char_length(buyer_phone) <= 30),
  total_cents                 integer not null check (total_cents >= 0),
  currency                    char(3) not null default 'MXN',
  status                      public.order_status not null default 'pending',
  channel                     public.order_channel not null default 'online',
  payment_method              public.payment_method not null default 'stripe',
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text unique,
  expires_at                  timestamptz,
  paid_at                     timestamptz,
  refunded_cents              integer not null default 0 check (refunded_cents >= 0),
  created_by                  uuid references public.profiles (id) on delete set null,
  notes                       text check (notes is null or char_length(notes) <= 1000),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint orders_pending_needs_expiry check (status <> 'pending' or expires_at is not null),
  constraint orders_complimentary_free check (channel <> 'complimentary' or total_cents = 0)
);
create index orders_event_status_idx on public.orders (event_id, status);
create index orders_user_idx on public.orders (user_id);
create index orders_buyer_email_idx on public.orders (lower(buyer_email));
create index orders_pending_expiry_idx on public.orders (expires_at) where status = 'pending';
create index orders_created_at_idx on public.orders (event_id, created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function private.set_updated_at();

create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  ticket_type_id    uuid not null references public.ticket_types (id) on delete restrict,
  quantity          integer not null check (quantity > 0),
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  subtotal_cents    integer generated always as (quantity * unit_price_cents) stored,
  constraint order_items_unique_type unique (order_id, ticket_type_id)
);
create index order_items_ticket_type_idx on public.order_items (ticket_type_id);

-- -----------------------------------------------------------------------------
-- Boletos (uno por asistente; cada uno con su propio QR)
-- -----------------------------------------------------------------------------
create table public.tickets (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events (id) on delete restrict,
  order_item_id     uuid references public.order_items (id) on delete restrict,
  ticket_type_id    uuid not null references public.ticket_types (id) on delete restrict,
  owner_profile_id  uuid references public.profiles (id) on delete set null,
  attendee_name     text not null default '' check (char_length(attendee_name) <= 120),
  attendee_email    text check (attendee_email is null or char_length(attendee_email) <= 254),
  public_code       text not null unique,          -- legible, para búsqueda manual
  qr_token          text not null unique,          -- secreto aleatorio (>=240 bits) contenido en el QR
  status            public.ticket_status not null default 'valid',
  issued_at         timestamptz not null default now(),
  checked_in_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint tickets_checked_in_consistency check (status <> 'checked_in' or checked_in_at is not null)
);
create index tickets_event_status_idx on public.tickets (event_id, status);
create index tickets_ticket_type_status_idx on public.tickets (ticket_type_id, status);
create index tickets_owner_idx on public.tickets (owner_profile_id);
create index tickets_order_item_idx on public.tickets (order_item_id);
create index tickets_attendee_email_idx on public.tickets (lower(attendee_email));
create trigger tickets_updated_at before update on public.tickets
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Actividades (clases, talleres, experiencias) y conferencias
-- -----------------------------------------------------------------------------
create table public.activities (
  id                       uuid primary key default gen_random_uuid(),
  event_id                 uuid not null references public.events (id) on delete cascade,
  name                     text not null check (char_length(name) between 2 and 160),
  category                 text not null default 'clase' check (char_length(category) <= 60),
  description              text not null default '',
  instructor               text not null default '',
  instructor_bio           text not null default '',
  starts_at                timestamptz not null,
  ends_at                  timestamptz not null,
  location                 text not null default '',
  capacity                 integer not null check (capacity >= 0),
  status                   public.session_status not null default 'draft',
  -- Reglas de reserva
  requires_ticket          boolean not null default true,
  waitlist_enabled         boolean not null default false,
  cancellation_cutoff_minutes integer not null default 60 check (cancellation_cutoff_minutes >= 0),
  image_url                text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint activities_dates_check check (ends_at > starts_at)
);
create index activities_event_start_idx on public.activities (event_id, starts_at);
create trigger activities_updated_at before update on public.activities
  for each row execute function private.set_updated_at();

create table public.conferences (
  id                       uuid primary key default gen_random_uuid(),
  event_id                 uuid not null references public.events (id) on delete cascade,
  title                    text not null check (char_length(title) between 2 and 200),
  description              text not null default '',
  speaker_name             text not null default '',
  speaker_bio              text not null default '',
  speaker_photo_url        text,
  starts_at                timestamptz not null,
  ends_at                  timestamptz not null,
  location                 text not null default '',
  capacity                 integer not null check (capacity >= 0),
  requires_reservation     boolean not null default false,
  requires_ticket          boolean not null default true,
  waitlist_enabled         boolean not null default false,
  cancellation_cutoff_minutes integer not null default 60 check (cancellation_cutoff_minutes >= 0),
  status                   public.session_status not null default 'draft',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint conferences_dates_check check (ends_at > starts_at)
);
create index conferences_event_start_idx on public.conferences (event_id, starts_at);
create trigger conferences_updated_at before update on public.conferences
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Reservas: exactamente una de activity_id / conference_id
-- -----------------------------------------------------------------------------
create table public.reservations (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events (id) on delete cascade,
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  ticket_id      uuid references public.tickets (id) on delete cascade,
  activity_id    uuid references public.activities (id) on delete cascade,
  conference_id  uuid references public.conferences (id) on delete cascade,
  status         public.reservation_status not null,
  reserved_at    timestamptz not null default now(),
  promoted_at    timestamptz,
  cancelled_at   timestamptz,
  cancelled_by   uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint reservations_one_target check (num_nonnulls(activity_id, conference_id) = 1),
  constraint reservations_cancel_consistency check ((status = 'cancelled') = (cancelled_at is not null))
);
-- Una reserva activa por sesión y por boleto (o por perfil si la sesión no exige boleto).
create unique index reservations_activity_active_uniq
  on public.reservations (activity_id, coalesce(ticket_id, profile_id))
  where activity_id is not null and status <> 'cancelled';
create unique index reservations_conference_active_uniq
  on public.reservations (conference_id, coalesce(ticket_id, profile_id))
  where conference_id is not null and status <> 'cancelled';
create index reservations_activity_status_idx on public.reservations (activity_id, status, reserved_at);
create index reservations_conference_status_idx on public.reservations (conference_id, status, reserved_at);
create index reservations_profile_idx on public.reservations (profile_id, status);
create index reservations_ticket_idx on public.reservations (ticket_id);
create trigger reservations_updated_at before update on public.reservations
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Personal y permisos
-- -----------------------------------------------------------------------------
create table public.event_staff (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  -- null = alcance global (solo para super_admin)
  event_id     uuid references public.events (id) on delete cascade,
  role         public.staff_role not null,
  -- Permisos adicionales puntuales, p. ej. 'issue_complimentary'
  permissions  text[] not null default '{}',
  is_active    boolean not null default true,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint event_staff_scope check ((role = 'super_admin') = (event_id is null))
);
create unique index event_staff_user_scope_uniq
  on public.event_staff (user_id, coalesce(event_id, '00000000-0000-0000-0000-000000000000'::uuid));
create trigger event_staff_updated_at before update on public.event_staff
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Check-ins (registro de cada intento de validación, aceptado o no)
-- -----------------------------------------------------------------------------
create table public.check_ins (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid references public.tickets (id) on delete set null,
  event_id     uuid not null references public.events (id) on delete cascade,
  staff_id     uuid references public.profiles (id) on delete set null,
  result       public.check_in_result not null,
  access_area  text not null default 'general',
  method       text not null default 'scan' check (method in ('scan', 'manual')),
  created_at   timestamptz not null default now()
);
create index check_ins_event_created_idx on public.check_ins (event_id, created_at desc);
create index check_ins_ticket_idx on public.check_ins (ticket_id);

-- -----------------------------------------------------------------------------
-- Incidencias con historial
-- -----------------------------------------------------------------------------
create table public.incidents (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  ticket_id    uuid references public.tickets (id) on delete set null,
  category     public.incident_category not null,
  title        text not null check (char_length(title) between 3 and 160),
  description  text not null default '' check (char_length(description) <= 4000),
  priority     public.incident_priority not null default 'medium',
  status       public.incident_status not null default 'open',
  assigned_to  uuid references public.profiles (id) on delete set null,
  resolution   text check (resolution is null or char_length(resolution) <= 4000),
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  closed_at    timestamptz
);
create index incidents_event_status_idx on public.incidents (event_id, status, priority);
create trigger incidents_updated_at before update on public.incidents
  for each row execute function private.set_updated_at();

create table public.incident_updates (
  id           uuid primary key default gen_random_uuid(),
  incident_id  uuid not null references public.incidents (id) on delete cascade,
  author_id    uuid references public.profiles (id) on delete set null,
  note         text not null default '' check (char_length(note) <= 4000),
  from_status  public.incident_status,
  to_status    public.incident_status,
  changes      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index incident_updates_incident_idx on public.incident_updates (incident_id, created_at);

-- -----------------------------------------------------------------------------
-- Auditoría (sin datos sensibles)
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id) on delete set null,
  event_id    uuid references public.events (id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_event_created_idx on public.audit_logs (event_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);

-- -----------------------------------------------------------------------------
-- Idempotencia de webhooks de Stripe
-- -----------------------------------------------------------------------------
create table public.stripe_events (
  id            text primary key,
  type          text not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  attempts      integer not null default 1,
  last_error    text
);

-- -----------------------------------------------------------------------------
-- Contenido administrable
-- -----------------------------------------------------------------------------
create table public.sponsors (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  name          text not null check (char_length(name) between 2 and 120),
  tier          text not null default 'aliado' check (char_length(tier) <= 40),
  description   text not null default '',
  logo_url      text,
  website_url   text,
  sort_order    integer not null default 0,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index sponsors_event_idx on public.sponsors (event_id, sort_order);
create trigger sponsors_updated_at before update on public.sponsors
  for each row execute function private.set_updated_at();

create table public.exhibitors (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  name          text not null check (char_length(name) between 2 and 120),
  category      text not null default 'bienestar' check (char_length(category) <= 60),
  description   text not null default '',
  logo_url      text,
  website_url   text,
  booth         text,
  sort_order    integer not null default 0,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index exhibitors_event_idx on public.exhibitors (event_id, sort_order);
create trigger exhibitors_updated_at before update on public.exhibitors
  for each row execute function private.set_updated_at();

create table public.faqs (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  question      text not null check (char_length(question) between 3 and 300),
  answer        text not null check (char_length(answer) <= 4000),
  sort_order    integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);
create index faqs_event_idx on public.faqs (event_id, sort_order);

create table public.announcements (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  title         text not null check (char_length(title) between 2 and 160),
  body          text not null default '' check (char_length(body) <= 2000),
  is_published  boolean not null default true,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index announcements_event_idx on public.announcements (event_id, created_at desc);
