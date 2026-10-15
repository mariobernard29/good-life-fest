-- =============================================================================
-- Registro manual de participantes, pulseras y notificaciones push
--
-- Operación: las entradas se venden solo en puntos físicos o por mensaje. El
-- personal registra a cada persona (nombre, correo, teléfono, edad); el servidor
-- crea su cuenta con un enlace de invitación y le emite su boleto en el mismo
-- paso. La persona activa su cuenta poniendo su contraseña.
--
--   * profiles.age / activated_at      datos del registro y activación de la cuenta.
--   * orders.sale_source               punto físico o mensaje.
--   * tickets.wristband_delivered_at   pulsera entregada (null = pendiente). Quién
--                                      la entregó queda en audit_logs (sin FK extra a
--                                      profiles para no volver ambiguos los embeds).
--   * reservations.reminder_sent_at    recordatorio push ya enviado.
--   * push_subscriptions / notifications  suscripciones Web Push y avisos programados.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Columnas nuevas
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column age smallint check (age is null or age between 1 and 120),
  add column activated_at timestamptz;

-- Las cuentas que ya existían con correo verificado se consideran activadas.
update public.profiles p set activated_at = p.created_at
 where exists (select 1 from auth.users u where u.id = p.id and u.email_confirmed_at is not null);

alter table public.orders
  add column sale_source text check (sale_source is null or sale_source in ('punto_fisico', 'mensaje'));

alter table public.tickets
  add column wristband_delivered_at timestamptz;

alter table public.reservations
  add column reminder_sent_at timestamptz;

-- El perfil automático ahora también guarda la edad capturada en el registro.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_age text := new.raw_user_meta_data ->> 'age';
begin
  insert into public.profiles (id, email, full_name, phone, age)
  values (
    new.id,
    coalesce(new.email, ''),
    -- full_name/phone/age son datos de presentación; nunca se usan para autorizar.
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 30), ''),
    case when v_age ~ '^[0-9]{1,3}$' and v_age::integer between 1 and 120 then v_age::smallint end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Suscripciones Web Push (una por navegador/dispositivo)
-- -----------------------------------------------------------------------------
create table public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  endpoint      text not null unique check (char_length(endpoint) <= 1000),
  p256dh        text not null check (char_length(p256dh) <= 200),
  auth          text not null check (char_length(auth) <= 100),
  user_agent    text check (user_agent is null or char_length(user_agent) <= 300),
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);
create index push_subscriptions_profile_idx on public.push_subscriptions (profile_id);

-- -----------------------------------------------------------------------------
-- Avisos push programados por el personal
-- -----------------------------------------------------------------------------
create table public.notifications (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events (id) on delete cascade,
  title          text not null check (char_length(title) between 2 and 80),
  body           text not null check (char_length(body) between 1 and 300),
  -- Solo rutas internas del sitio (evita usar los avisos para mandar a otros dominios).
  url            text check (url is null or (char_length(url) <= 300 and url ~ '^/[^/]')),
  audience       text not null default 'all' check (audience in ('all', 'activity', 'conference')),
  activity_id    uuid references public.activities (id) on delete cascade,
  conference_id  uuid references public.conferences (id) on delete cascade,
  send_at        timestamptz not null default now(),
  status         text not null default 'scheduled'
                 check (status in ('scheduled', 'sending', 'sent', 'cancelled', 'failed')),
  sent_count     integer not null default 0,
  failed_count   integer not null default 0,
  sent_at        timestamptz,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint notifications_audience_target check (
    (audience = 'all' and activity_id is null and conference_id is null)
    or (audience = 'activity' and activity_id is not null and conference_id is null)
    or (audience = 'conference' and conference_id is not null and activity_id is null)
  )
);
create index notifications_due_idx on public.notifications (status, send_at);
create index notifications_event_idx on public.notifications (event_id, send_at desc);
create trigger notifications_updated_at before update on public.notifications
  for each row execute function private.set_updated_at();

-- Solo el servidor (service_role) lee y escribe estas tablas.
alter table public.push_subscriptions enable row level security;
alter table public.notifications      enable row level security;
revoke all on public.push_subscriptions, public.notifications from anon, authenticated;
grant all on public.push_subscriptions, public.notifications to service_role;

-- -----------------------------------------------------------------------------
-- Venta manual: ahora registra cómo se compró y si la pulsera ya se entregó.
-- Se elimina la firma anterior para no dejar una sobrecarga ambigua.
-- -----------------------------------------------------------------------------
drop function public.create_manual_sale(
  uuid, uuid, uuid, integer, text, text, text, jsonb, public.payment_method, boolean, boolean, text
);

create function public.create_manual_sale(
  p_event_id uuid,
  p_staff_id uuid,
  p_ticket_type_id uuid,
  p_quantity integer,
  p_buyer_email text,
  p_buyer_name text,
  p_buyer_phone text,
  p_attendees jsonb,
  p_payment_method public.payment_method,
  p_payment_confirmed boolean,
  p_complimentary boolean,
  p_notes text default null,
  p_sale_source text default null,
  p_wristband_delivered boolean default false
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_event public.events;
  v_lines jsonb;
  v_order_id uuid;
  v_reference text;
  v_total integer;
  v_unit integer;
  v_channel public.order_channel;
  v_method public.payment_method;
  v_status public.order_status;
  v_ticket_status public.ticket_status;
  v_issued integer;
  v_user uuid;
begin
  perform private.assert_staff(p_staff_id, p_event_id,
    array['event_admin', 'ticketing_staff']::public.staff_role[]);

  if p_sale_source is not null and p_sale_source not in ('punto_fisico', 'mensaje') then
    raise exception 'GLF:INVALID_SALE_SOURCE';
  end if;

  if p_complimentary then
    if not private.staff_has_permission(p_staff_id, p_event_id, 'issue_complimentary') then
      raise exception 'GLF:FORBIDDEN_COMPLIMENTARY';
    end if;
    if p_notes is null or char_length(trim(p_notes)) < 5 then
      raise exception 'GLF:COMPLIMENTARY_REASON_REQUIRED';
    end if;
    v_channel := 'complimentary';
    v_method := 'complimentary';
    v_status := 'paid';
    v_ticket_status := 'valid';
  else
    if p_payment_method is null or p_payment_method in ('stripe', 'complimentary') then
      raise exception 'GLF:INVALID_PAYMENT_METHOD';
    end if;
    v_channel := 'box_office';
    v_method := p_payment_method;
    v_status := case when p_payment_confirmed then 'paid' else 'awaiting_payment' end;
    v_ticket_status := case when p_payment_confirmed then 'valid' else 'pending_payment' end;
  end if;

  if p_buyer_email is null or p_buyer_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'GLF:INVALID_EMAIL';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.status not in ('published', 'closed') then
    raise exception 'GLF:EVENT_NOT_ON_SALE';
  end if;

  perform public.expire_stale_orders(p_event_id);
  v_lines := private.assert_inventory(v_event,
    jsonb_build_array(jsonb_build_object('ticket_type_id', p_ticket_type_id, 'quantity', p_quantity)),
    v_channel);

  v_unit := case when p_complimentary then 0 else (v_lines -> 0 ->> 'unit_price_cents')::integer end;
  v_total := v_unit * p_quantity;
  v_reference := private.new_order_reference();

  -- Vincular a una cuenta existente si el correo coincide.
  select id into v_user from public.profiles where lower(email) = lower(trim(p_buyer_email)) limit 1;

  insert into public.orders (
    event_id, user_id, reference, buyer_email, buyer_name, buyer_phone, total_cents, currency,
    status, channel, payment_method, paid_at, created_by, notes, sale_source
  ) values (
    p_event_id, v_user, v_reference, lower(trim(p_buyer_email)), trim(coalesce(p_buyer_name, '')),
    nullif(trim(coalesce(p_buyer_phone, '')), ''), v_total, 'MXN',
    v_status, v_channel, v_method, case when v_status = 'paid' then now() end, p_staff_id,
    nullif(trim(coalesce(p_notes, '')), ''), p_sale_source
  ) returning id into v_order_id;

  insert into public.order_items (order_id, ticket_type_id, quantity, unit_price_cents)
  values (v_order_id, p_ticket_type_id, p_quantity, v_unit);

  v_issued := private.issue_tickets(v_order_id, v_ticket_status, p_attendees);

  if coalesce(p_wristband_delivered, false) then
    update public.tickets t set wristband_delivered_at = now()
      from public.order_items oi
     where oi.id = t.order_item_id and oi.order_id = v_order_id;
  end if;

  perform private.audit(p_staff_id, p_event_id,
    case when p_complimentary then 'order.complimentary_issued' else 'order.box_office_sale' end,
    'order', v_order_id::text,
    jsonb_build_object('quantity', p_quantity, 'payment_method', v_method, 'status', v_status,
      'total_cents', v_total, 'ticket_type_id', p_ticket_type_id, 'sale_source', p_sale_source,
      'wristband_delivered', coalesce(p_wristband_delivered, false)));

  return jsonb_build_object('order_id', v_order_id, 'reference', v_reference, 'status', v_status,
    'tickets_issued', v_issued, 'total_cents', v_total);
end;
$$;

-- -----------------------------------------------------------------------------
-- Pulsera entregada / pendiente
-- -----------------------------------------------------------------------------
create or replace function public.set_wristband_status(p_ticket_id uuid, p_staff_id uuid, p_delivered boolean)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_ticket public.tickets;
begin
  select * into v_ticket from public.tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'GLF:TICKET_NOT_FOUND';
  end if;
  perform private.assert_staff(p_staff_id, v_ticket.event_id,
    array['event_admin', 'ticketing_staff', 'checkin_staff']::public.staff_role[]);
  if v_ticket.status in ('cancelled', 'refunded') then
    raise exception 'GLF:TICKET_NOT_VALID';
  end if;

  if (v_ticket.wristband_delivered_at is not null) = p_delivered then
    return jsonb_build_object('changed', false, 'wristband_delivered_at', v_ticket.wristband_delivered_at);
  end if;

  update public.tickets
     set wristband_delivered_at = case when p_delivered then now() end
   where id = p_ticket_id
  returning * into v_ticket;

  perform private.audit(p_staff_id, v_ticket.event_id,
    case when p_delivered then 'ticket.wristband_delivered' else 'ticket.wristband_pending' end,
    'ticket', p_ticket_id::text, '{}'::jsonb);
  return jsonb_build_object('changed', true, 'wristband_delivered_at', v_ticket.wristband_delivered_at);
end;
$$;

-- -----------------------------------------------------------------------------
-- Recordatorios: toma (y marca) las reservas confirmadas cuya sesión publicada
-- empieza dentro de los próximos p_lead_minutes. SKIP LOCKED + la marca
-- reminder_sent_at garantizan que cada reserva se recuerde una sola vez aunque
-- el despachador corra en paralelo.
-- -----------------------------------------------------------------------------
create or replace function public.claim_due_reminders(p_event_id uuid, p_lead_minutes integer)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_rows jsonb;
begin
  if p_lead_minutes is null or p_lead_minutes <= 0 then
    return '[]'::jsonb;
  end if;

  with due as (
    select r.id
      from public.reservations r
      left join public.activities a on a.id = r.activity_id
      left join public.conferences c on c.id = r.conference_id
     where r.event_id = p_event_id
       and r.status = 'confirmed'
       and r.reminder_sent_at is null
       and coalesce(a.status, c.status) = 'published'
       and coalesce(a.starts_at, c.starts_at) > now()
       and coalesce(a.starts_at, c.starts_at) <= now() + make_interval(mins => p_lead_minutes)
       for update of r skip locked
  ), claimed as (
    update public.reservations r
       set reminder_sent_at = now()
      from due
     where r.id = due.id
    returning r.id, r.profile_id, r.activity_id, r.conference_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'reservation_id', cl.id,
           'profile_id', cl.profile_id,
           'kind', case when cl.activity_id is not null then 'activity' else 'conference' end,
           'name', coalesce(a.name, c.title),
           'starts_at', coalesce(a.starts_at, c.starts_at),
           'location', coalesce(a.location, c.location))), '[]'::jsonb)
    into v_rows
    from claimed cl
    left join public.activities a on a.id = cl.activity_id
    left join public.conferences c on c.id = cl.conference_id;

  return v_rows;
end;
$$;

-- -----------------------------------------------------------------------------
-- Avisos programados: toma los que ya deben salir y los pasa a 'sending'.
-- Los que quedaron atorados en 'sending' (el envío se interrumpió) se marcan
-- como 'failed' en lugar de reenviarse, para no duplicar.
-- -----------------------------------------------------------------------------
create or replace function public.claim_due_notifications(p_event_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_rows jsonb;
begin
  update public.notifications
     set status = 'failed'
   where event_id = p_event_id and status = 'sending' and updated_at < now() - interval '15 minutes';

  with due as (
    select n.id
      from public.notifications n
     where n.event_id = p_event_id and n.status = 'scheduled' and n.send_at <= now()
     order by n.send_at
       for update skip locked
  ), claimed as (
    update public.notifications n
       set status = 'sending'
      from due
     where n.id = due.id
    returning n.id, n.title, n.body, n.url, n.audience, n.activity_id, n.conference_id, n.send_at
  )
  select coalesce(jsonb_agg(to_jsonb(claimed) order by claimed.send_at), '[]'::jsonb)
    into v_rows
    from claimed;

  return v_rows;
end;
$$;

-- Suscripciones a las que debe llegar un aviso:
--   all         -> participantes con boleto activo del evento
--   activity /
--   conference  -> participantes con reserva confirmada en esa sesión
create or replace function public.notification_recipients(p_notification_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with n as (select * from public.notifications where id = p_notification_id),
  targets as (
    select distinct t.owner_profile_id as profile_id
      from n join public.tickets t on t.event_id = n.event_id
     where n.audience = 'all'
       and t.owner_profile_id is not null
       and t.status in ('valid', 'checked_in', 'pending_payment')
    union
    select distinct r.profile_id
      from n join public.reservations r
        on (n.audience = 'activity' and r.activity_id = n.activity_id)
        or (n.audience = 'conference' and r.conference_id = n.conference_id)
     where r.status = 'confirmed'
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', s.id, 'profile_id', s.profile_id, 'endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)),
         '[]'::jsonb)
    from public.push_subscriptions s
    join targets tg on tg.profile_id = s.profile_id;
$$;

-- -----------------------------------------------------------------------------
-- Privilegios: igual que en 0300, solo el servidor ejecuta las funciones.
-- -----------------------------------------------------------------------------
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
grant execute on all functions in schema private to service_role;
