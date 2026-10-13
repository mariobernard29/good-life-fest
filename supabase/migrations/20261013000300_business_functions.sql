-- =============================================================================
-- Funciones transaccionales de negocio
--
-- Todas se ejecutan como SECURITY INVOKER y solo el rol service_role tiene
-- EXECUTE: el navegador nunca puede invocarlas. El servidor de Next.js valida la
-- sesión y los permisos y después llama a estas funciones.
--
-- Errores de negocio: se lanzan como  `GLF:<CODIGO>`  (SQLSTATE P0001) y la capa
-- TypeScript los traduce a mensajes en español (src/lib/errors.ts).
--
-- Concurrencia:
--   * Inventario de entradas: bloqueo FOR UPDATE de la fila del evento. Todas las
--     operaciones que consumen inventario del mismo evento se serializan.
--   * Cupos de sesiones: bloqueo FOR UPDATE de la fila de la actividad/conferencia.
--   * Check-in: UPDATE condicional (status = 'valid') -> solo un dispositivo gana.
-- =============================================================================

grant usage on schema private to service_role;

-- -----------------------------------------------------------------------------
-- Utilidades internas
-- -----------------------------------------------------------------------------
create or replace function private.random_hex(p_len integer)
returns text
language sql
volatile
set search_path = ''
as $$
  -- gen_random_uuid() usa el CSPRNG de PostgreSQL (122 bits aleatorios por UUID).
  select upper(substr(
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
    || replace(gen_random_uuid()::text, '-', ''),
    1, p_len));
$$;

create or replace function private.new_qr_token()
returns text
language sql
volatile
set search_path = ''
as $$
  -- 2 UUID v4 = 244 bits aleatorios; no contiene datos personales.
  select lower(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));
$$;

create or replace function private.audit(
  p_actor uuid, p_event uuid, p_action text, p_entity text, p_entity_id text, p_details jsonb default '{}'::jsonb
)
returns void
language sql
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, event_id, action, entity, entity_id, details)
  values (p_actor, p_event, p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;

-- Verificación de rol de personal (defensa en profundidad; la matriz completa de
-- permisos vive en src/lib/auth/permissions.ts).
create or replace function private.assert_staff(p_user uuid, p_event uuid, p_roles public.staff_role[])
returns public.staff_role
language plpgsql
stable
set search_path = ''
as $$
declare
  v_role public.staff_role;
begin
  select s.role into v_role
  from public.event_staff s
  where s.user_id = p_user
    and s.is_active
    and (s.role = 'super_admin' or s.event_id = p_event)
    and (s.role = 'super_admin' or s.role = any (p_roles))
  order by (s.role = 'super_admin') desc
  limit 1;

  if v_role is null then
    raise exception 'GLF:FORBIDDEN';
  end if;
  return v_role;
end;
$$;

create or replace function private.staff_has_permission(p_user uuid, p_event uuid, p_permission text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.event_staff s
    where s.user_id = p_user and s.is_active
      and (
        s.role = 'super_admin'
        or (s.event_id = p_event and (s.role = 'event_admin' or p_permission = any (s.permissions)))
      )
  );
$$;

-- -----------------------------------------------------------------------------
-- Inventario de entradas
--   consumido = boletos emitidos activos + unidades retenidas por pedidos pendientes vigentes
-- -----------------------------------------------------------------------------
create or replace function public.ticket_type_consumed(p_ticket_type_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select (
    (select count(*) from public.tickets t
      where t.ticket_type_id = p_ticket_type_id
        and t.status in ('pending_payment', 'valid', 'checked_in'))
    +
    (select coalesce(sum(oi.quantity), 0) from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.ticket_type_id = p_ticket_type_id
        and o.status = 'pending' and o.expires_at > now())
  )::integer;
$$;

create or replace function public.event_consumed(p_event_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select (
    (select count(*) from public.tickets t
      where t.event_id = p_event_id
        and t.status in ('pending_payment', 'valid', 'checked_in'))
    +
    (select coalesce(sum(oi.quantity), 0) from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where o.event_id = p_event_id
        and o.status = 'pending' and o.expires_at > now())
  )::integer;
$$;

create or replace function public.get_ticket_availability(p_event_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with ev as (
    select e.max_capacity - public.event_consumed(e.id) as event_left
    from public.events e where e.id = p_event_id
  ), tt as (
    select t.id, t.quantity_total,
      public.ticket_type_consumed(t.id) as consumed,
      (select count(*) from public.tickets x
        where x.ticket_type_id = t.id and x.status in ('valid', 'checked_in', 'pending_payment'))::integer as issued
    from public.ticket_types t where t.event_id = p_event_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'ticket_type_id', tt.id,
    'quantity_total', tt.quantity_total,
    'issued', tt.issued,
    'held', tt.consumed - tt.issued,
    'available', greatest(0, least(tt.quantity_total - tt.consumed, (select event_left from ev)))
  )), '[]'::jsonb)
  from tt;
$$;

-- Marca como vencidos los pedidos pendientes cuya retención expiró.
create or replace function public.expire_stale_orders(p_event_id uuid default null)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.orders
     set status = 'expired'
   where status = 'pending'
     and expires_at <= now()
     and (p_event_id is null or event_id = p_event_id);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Valida tipos, ventanas de venta, límites por compra e inventario.
-- REQUIERE que el llamador tenga bloqueada la fila del evento.
create or replace function private.assert_inventory(
  p_event public.events, p_items jsonb, p_channel public.order_channel
)
returns jsonb  -- [{ticket_type_id, name, quantity, unit_price_cents}]
language plpgsql
set search_path = ''
as $$
declare
  v_line record;
  v_tt public.ticket_types;
  v_total_qty integer := 0;
  v_out jsonb := '[]'::jsonb;
  v_available integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'GLF:INVALID_ITEMS';
  end if;

  for v_line in
    select x.ticket_type_id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(ticket_type_id uuid, quantity integer)
    group by x.ticket_type_id
  loop
    if v_line.ticket_type_id is null or v_line.quantity is null or v_line.quantity < 1 then
      raise exception 'GLF:INVALID_ITEMS';
    end if;

    select * into v_tt from public.ticket_types
     where id = v_line.ticket_type_id and event_id = p_event.id;
    if not found then
      raise exception 'GLF:TICKET_TYPE_NOT_FOUND';
    end if;

    if p_channel = 'online' then
      if v_tt.sale_status <> 'on_sale' then
        raise exception 'GLF:TICKET_TYPE_NOT_ON_SALE' using detail = v_tt.name;
      end if;
      if v_tt.sales_start_at is not null and now() < v_tt.sales_start_at then
        raise exception 'GLF:SALES_NOT_STARTED' using detail = v_tt.name;
      end if;
      if v_tt.sales_end_at is not null and now() >= v_tt.sales_end_at then
        raise exception 'GLF:SALES_ENDED' using detail = v_tt.name;
      end if;
      if v_line.quantity > v_tt.max_per_order then
        raise exception 'GLF:QUANTITY_LIMIT' using detail = v_tt.max_per_order::text;
      end if;
    else
      -- Taquilla y cortesías: permitidas mientras el tipo esté en venta o sea exclusivo de taquilla.
      if v_tt.sale_status not in ('on_sale', 'box_office_only') then
        raise exception 'GLF:TICKET_TYPE_NOT_ON_SALE' using detail = v_tt.name;
      end if;
    end if;

    v_available := v_tt.quantity_total - public.ticket_type_consumed(v_tt.id);
    if v_line.quantity > v_available then
      raise exception 'GLF:INSUFFICIENT_INVENTORY' using detail = greatest(v_available, 0)::text;
    end if;

    v_total_qty := v_total_qty + v_line.quantity;
    v_out := v_out || jsonb_build_object(
      'ticket_type_id', v_tt.id, 'name', v_tt.name, 'description', v_tt.description,
      'quantity', v_line.quantity, 'unit_price_cents', v_tt.price_cents, 'currency', v_tt.currency
    );
  end loop;

  if public.event_consumed(p_event.id) + v_total_qty > p_event.max_capacity then
    raise exception 'GLF:EVENT_CAPACITY_REACHED'
      using detail = greatest(p_event.max_capacity - public.event_consumed(p_event.id), 0)::text;
  end if;

  return v_out;
end;
$$;

create or replace function private.new_order_reference()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'GLF-' || private.random_hex(4) || '-' || private.random_hex(4);
$$;

-- Emite un boleto por unidad de cada partida del pedido.
create or replace function private.issue_tickets(
  p_order_id uuid, p_status public.ticket_status, p_attendees jsonb default null
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders;
  v_item public.order_items;
  v_idx integer := 0;
  v_i integer;
  v_name text;
  v_email text;
  v_issued integer := 0;
  v_attempt integer;
begin
  select * into v_order from public.orders where id = p_order_id;

  for v_item in select * from public.order_items where order_id = p_order_id order by id loop
    for v_i in 1 .. v_item.quantity loop
      v_name := nullif(trim(coalesce(p_attendees -> v_idx ->> 'name', '')), '');
      v_email := nullif(lower(trim(coalesce(p_attendees -> v_idx ->> 'email', ''))), '');
      v_idx := v_idx + 1;
      v_attempt := 0;
      loop
        begin
          insert into public.tickets (
            event_id, order_item_id, ticket_type_id, owner_profile_id,
            attendee_name, attendee_email, public_code, qr_token, status
          ) values (
            v_order.event_id, v_item.id, v_item.ticket_type_id,
            case when v_email is null or v_email = lower(v_order.buyer_email) then v_order.user_id end,
            coalesce(v_name, v_order.buyer_name, ''),
            v_email,
            'GL-' || private.random_hex(5) || '-' || private.random_hex(5),
            private.new_qr_token(),
            p_status
          );
          exit;
        exception when unique_violation then
          v_attempt := v_attempt + 1;
          if v_attempt > 5 then raise; end if;
        end;
      end loop;
      v_issued := v_issued + 1;
    end loop;
  end loop;

  return v_issued;
end;
$$;

-- -----------------------------------------------------------------------------
-- Venta en línea: retención de inventario + pedido pendiente
-- -----------------------------------------------------------------------------
create or replace function public.create_order_hold(
  p_event_id uuid,
  p_items jsonb,
  p_buyer_email text,
  p_buyer_name text,
  p_buyer_phone text default null,
  p_user_id uuid default null,
  p_hold_minutes integer default 35
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_event public.events;
  v_lines jsonb;
  v_line jsonb;
  v_order_id uuid;
  v_reference text;
  v_total integer := 0;
  v_expires timestamptz := now() + make_interval(mins => greatest(p_hold_minutes, 5));
begin
  if p_buyer_email is null or p_buyer_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'GLF:INVALID_EMAIL';
  end if;

  -- Serializa el inventario del evento.
  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.status <> 'published' then
    raise exception 'GLF:EVENT_NOT_ON_SALE';
  end if;
  if coalesce((v_event.settings ->> 'online_sales_enabled')::boolean, true) = false then
    raise exception 'GLF:EVENT_NOT_ON_SALE';
  end if;

  perform public.expire_stale_orders(p_event_id);
  v_lines := private.assert_inventory(v_event, p_items, 'online');

  select coalesce(sum((l ->> 'quantity')::integer * (l ->> 'unit_price_cents')::integer), 0)
    into v_total from jsonb_array_elements(v_lines) l;

  v_reference := private.new_order_reference();
  insert into public.orders (
    event_id, user_id, reference, buyer_email, buyer_name, buyer_phone,
    total_cents, currency, status, channel, payment_method, expires_at
  ) values (
    p_event_id, p_user_id, v_reference, lower(trim(p_buyer_email)), trim(coalesce(p_buyer_name, '')),
    nullif(trim(coalesce(p_buyer_phone, '')), ''), v_total, 'MXN', 'pending', 'online', 'stripe', v_expires
  ) returning id into v_order_id;

  for v_line in select * from jsonb_array_elements(v_lines) loop
    insert into public.order_items (order_id, ticket_type_id, quantity, unit_price_cents)
    values (v_order_id, (v_line ->> 'ticket_type_id')::uuid, (v_line ->> 'quantity')::integer,
            (v_line ->> 'unit_price_cents')::integer);
  end loop;

  return jsonb_build_object(
    'order_id', v_order_id,
    'reference', v_reference,
    'total_cents', v_total,
    'currency', 'MXN',
    'expires_at', v_expires,
    'items', v_lines
  );
end;
$$;

create or replace function public.attach_checkout_session(p_order_id uuid, p_session_id text)
returns void
language sql
set search_path = ''
as $$
  update public.orders
     set stripe_checkout_session_id = p_session_id
   where id = p_order_id and status = 'pending';
$$;

-- Libera la retención de un pedido pendiente (sesión vencida, pago fallido, error).
create or replace function public.release_order(p_order_id uuid, p_status public.order_status, p_reason text default null)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if p_status not in ('expired', 'failed', 'cancelled') then
    raise exception 'GLF:INVALID_STATUS';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'GLF:ORDER_NOT_FOUND';
  end if;
  if v_order.status not in ('pending', 'expired') then
    return jsonb_build_object('updated', false, 'status', v_order.status);
  end if;

  update public.orders set status = p_status where id = p_order_id;
  perform private.audit(null, v_order.event_id, 'order.' || p_status::text, 'order', p_order_id::text,
    jsonb_build_object('reason', p_reason));
  return jsonb_build_object('updated', true, 'status', p_status);
end;
$$;

-- -----------------------------------------------------------------------------
-- Confirmación de pago (webhook) — idempotente
-- -----------------------------------------------------------------------------
create or replace function public.fulfill_order_payment(
  p_order_id uuid,
  p_session_id text,
  p_payment_intent_id text,
  p_amount_cents integer,
  p_currency text
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_event public.events;
  v_order public.orders;
  v_late boolean;
  v_issued integer;
  v_oversold boolean;
begin
  select event_id into v_event_id from public.orders where id = p_order_id;
  if v_event_id is null then
    raise exception 'GLF:ORDER_NOT_FOUND';
  end if;

  -- Mismo orden de bloqueo que create_order_hold: evento -> pedido.
  select * into v_event from public.events where id = v_event_id for update;
  select * into v_order from public.orders where id = p_order_id for update;

  if v_order.status in ('paid', 'refunded', 'partially_refunded') then
    return jsonb_build_object('status', 'already_processed', 'tickets_issued', 0);
  end if;

  if v_order.status not in ('pending', 'expired', 'failed', 'cancelled') then
    raise exception 'GLF:ORDER_STATE_INVALID' using detail = v_order.status::text;
  end if;

  if p_amount_cents is distinct from v_order.total_cents or upper(coalesce(p_currency, '')) <> v_order.currency then
    insert into public.incidents (event_id, category, title, description, priority)
    values (v_order.event_id, 'payment_issue', 'Importe de pago no coincide',
      format('Pedido %s: se esperaban %s %s y Stripe reportó %s %s. No se emitieron boletos.',
        v_order.reference, v_order.total_cents, v_order.currency, p_amount_cents, upper(coalesce(p_currency, ''))),
      'urgent');
    perform private.audit(null, v_order.event_id, 'order.amount_mismatch', 'order', p_order_id::text, '{}'::jsonb);
    return jsonb_build_object('status', 'amount_mismatch', 'tickets_issued', 0);
  end if;

  v_late := v_order.status <> 'pending' or v_order.expires_at <= now();

  update public.orders
     set status = 'paid',
         paid_at = now(),
         stripe_checkout_session_id = coalesce(p_session_id, stripe_checkout_session_id),
         stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id)
   where id = p_order_id;

  v_issued := private.issue_tickets(p_order_id, 'valid');

  if v_late then
    -- El pago llegó después de liberar la retención: verificar sobreventa.
    select exists (
      select 1 from public.ticket_types t
      where t.event_id = v_order.event_id
        and public.ticket_type_consumed(t.id) > t.quantity_total
    ) or public.event_consumed(v_order.event_id) > v_event.max_capacity
    into v_oversold;

    if v_oversold then
      insert into public.incidents (event_id, category, title, description, priority)
      values (v_order.event_id, 'payment_issue', 'Pago tardío con posible sobreventa',
        format('El pedido %s se pagó después de vencer su retención y el inventario quedó excedido. Revisar aforo o reembolsar.', v_order.reference),
        'urgent');
    end if;
  end if;

  perform private.audit(null, v_order.event_id, 'order.paid', 'order', p_order_id::text,
    jsonb_build_object('tickets_issued', v_issued, 'late', v_late, 'channel', v_order.channel));

  return jsonb_build_object('status', 'fulfilled', 'tickets_issued', v_issued, 'late', v_late);
end;
$$;

-- -----------------------------------------------------------------------------
-- Reservas: utilidades
-- -----------------------------------------------------------------------------
create type private.session_info as (
  kind text,
  id uuid,
  event_id uuid,
  capacity integer,
  starts_at timestamptz,
  ends_at timestamptz,
  status public.session_status,
  requires_ticket boolean,
  requires_reservation boolean,
  waitlist_enabled boolean,
  cutoff_minutes integer
);

-- Bloquea (FOR UPDATE) y devuelve la sesión.
create or replace function private.lock_session(p_activity_id uuid, p_conference_id uuid)
returns private.session_info
language plpgsql
set search_path = ''
as $$
declare
  v private.session_info;
begin
  if num_nonnulls(p_activity_id, p_conference_id) <> 1 then
    raise exception 'GLF:INVALID_SESSION';
  end if;

  if p_activity_id is not null then
    select 'activity', a.id, a.event_id, a.capacity, a.starts_at, a.ends_at, a.status,
           a.requires_ticket, true, a.waitlist_enabled, a.cancellation_cutoff_minutes
      into v
      from public.activities a where a.id = p_activity_id for update;
  else
    select 'conference', c.id, c.event_id, c.capacity, c.starts_at, c.ends_at, c.status,
           c.requires_ticket, c.requires_reservation, c.waitlist_enabled, c.cancellation_cutoff_minutes
      into v
      from public.conferences c where c.id = p_conference_id for update;
  end if;

  if v.id is null then
    raise exception 'GLF:SESSION_NOT_FOUND';
  end if;
  return v;
end;
$$;

create or replace function private.session_confirmed_count(p_activity_id uuid, p_conference_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer from public.reservations r
  where r.status = 'confirmed'
    and ((p_activity_id is not null and r.activity_id = p_activity_id)
      or (p_conference_id is not null and r.conference_id = p_conference_id));
$$;

-- Promueve la lista de espera en orden FIFO mientras haya cupo.
-- REQUIERE la sesión bloqueada.
create or replace function private.promote_waitlist(p_activity_id uuid, p_conference_id uuid, p_capacity integer)
returns uuid[]
language plpgsql
set search_path = ''
as $$
declare
  v_free integer;
  v_ids uuid[];
begin
  v_free := p_capacity - private.session_confirmed_count(p_activity_id, p_conference_id);
  if v_free <= 0 then
    return '{}';
  end if;

  with next_in_line as (
    select r.id from public.reservations r
    where r.status = 'waitlisted'
      and ((p_activity_id is not null and r.activity_id = p_activity_id)
        or (p_conference_id is not null and r.conference_id = p_conference_id))
    order by r.reserved_at, r.id
    limit v_free
    for update
  ), promoted as (
    update public.reservations r
       set status = 'confirmed', promoted_at = now()
      from next_in_line n
     where r.id = n.id
    returning r.id
  )
  select coalesce(array_agg(id), '{}') into v_ids from promoted;
  return v_ids;
end;
$$;

-- -----------------------------------------------------------------------------
-- Reservar
-- -----------------------------------------------------------------------------
create or replace function public.reserve_session(
  p_profile_id uuid,
  p_ticket_id uuid,
  p_activity_id uuid default null,
  p_conference_id uuid default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_session private.session_info;
  v_event public.events;
  v_ticket public.tickets;
  v_ticket_id uuid := p_ticket_id;
  v_confirmed integer;
  v_status public.reservation_status;
  v_reservation_id uuid;
  v_max integer;
  v_active integer;
  v_position integer;
begin
  -- 1. Bloqueo de la sesión: serializa reservas concurrentes sobre el mismo cupo.
  v_session := private.lock_session(p_activity_id, p_conference_id);

  if v_session.status <> 'published' then
    raise exception 'GLF:SESSION_NOT_BOOKABLE';
  end if;
  if not v_session.requires_reservation then
    raise exception 'GLF:RESERVATION_NOT_REQUIRED';
  end if;
  if v_session.starts_at <= now() then
    raise exception 'GLF:SESSION_STARTED';
  end if;

  select * into v_event from public.events where id = v_session.event_id;
  if coalesce((v_event.settings ->> 'reservations_open')::boolean, true) = false then
    raise exception 'GLF:RESERVATIONS_CLOSED';
  end if;

  -- 2. Validación del boleto.
  if v_ticket_id is not null then
    select * into v_ticket from public.tickets where id = v_ticket_id;
    if not found or v_ticket.owner_profile_id is distinct from p_profile_id then
      raise exception 'GLF:TICKET_NOT_OWNED';
    end if;
    if v_ticket.event_id <> v_session.event_id then
      raise exception 'GLF:TICKET_WRONG_EVENT';
    end if;
    if v_ticket.status not in ('valid', 'checked_in') then
      raise exception 'GLF:TICKET_NOT_VALID';
    end if;
  elsif v_session.requires_ticket then
    raise exception 'GLF:TICKET_REQUIRED';
  end if;

  -- 3. Duplicado.
  if exists (
    select 1 from public.reservations r
    where r.status <> 'cancelled'
      and coalesce(r.ticket_id, r.profile_id) = coalesce(v_ticket_id, p_profile_id)
      and ((p_activity_id is not null and r.activity_id = p_activity_id)
        or (p_conference_id is not null and r.conference_id = p_conference_id))
  ) then
    raise exception 'GLF:ALREADY_RESERVED';
  end if;

  -- 4. Conflicto de horario con otras reservas activas del mismo titular.
  if exists (
    select 1
    from public.reservations r
    left join public.activities a on a.id = r.activity_id
    left join public.conferences c on c.id = r.conference_id
    where r.status <> 'cancelled'
      and coalesce(r.ticket_id, r.profile_id) = coalesce(v_ticket_id, p_profile_id)
      and coalesce(a.starts_at, c.starts_at) < v_session.ends_at
      and coalesce(a.ends_at, c.ends_at) > v_session.starts_at
  ) then
    raise exception 'GLF:SCHEDULE_CONFLICT';
  end if;

  -- 5. Límite configurable de reservas activas por titular.
  v_max := nullif(v_event.settings ->> 'max_reservations_per_ticket', '')::integer;
  if v_max is not null then
    select count(*) into v_active from public.reservations r
    where r.status <> 'cancelled' and r.event_id = v_session.event_id
      and coalesce(r.ticket_id, r.profile_id) = coalesce(v_ticket_id, p_profile_id);
    if v_active >= v_max then
      raise exception 'GLF:RESERVATION_LIMIT' using detail = v_max::text;
    end if;
  end if;

  -- 6. Cupo.
  v_confirmed := private.session_confirmed_count(p_activity_id, p_conference_id);
  if v_confirmed < v_session.capacity then
    v_status := 'confirmed';
  elsif v_session.waitlist_enabled then
    v_status := 'waitlisted';
  else
    raise exception 'GLF:SESSION_FULL';
  end if;

  insert into public.reservations (event_id, profile_id, ticket_id, activity_id, conference_id, status)
  values (v_session.event_id, p_profile_id, v_ticket_id, p_activity_id, p_conference_id, v_status)
  returning id into v_reservation_id;

  if v_status = 'waitlisted' then
    select count(*) into v_position from public.reservations r
    where r.status = 'waitlisted'
      and ((p_activity_id is not null and r.activity_id = p_activity_id)
        or (p_conference_id is not null and r.conference_id = p_conference_id));
  end if;

  return jsonb_build_object(
    'reservation_id', v_reservation_id,
    'status', v_status,
    'waitlist_position', v_position,
    'remaining', greatest(v_session.capacity - v_confirmed - case when v_status = 'confirmed' then 1 else 0 end, 0)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Cancelar reserva (libera cupo y promueve lista de espera)
-- -----------------------------------------------------------------------------
create or replace function public.cancel_reservation(
  p_reservation_id uuid,
  p_actor_id uuid,
  p_as_admin boolean default false
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_res public.reservations;
  v_session private.session_info;
  v_promoted uuid[] := '{}';
begin
  select * into v_res from public.reservations where id = p_reservation_id;
  if not found then
    raise exception 'GLF:RESERVATION_NOT_FOUND';
  end if;
  if not p_as_admin and v_res.profile_id <> p_actor_id then
    raise exception 'GLF:RESERVATION_NOT_FOUND';
  end if;

  v_session := private.lock_session(v_res.activity_id, v_res.conference_id);
  select * into v_res from public.reservations where id = p_reservation_id for update;

  if v_res.status = 'cancelled' then
    return jsonb_build_object('cancelled', false, 'already_cancelled', true, 'promoted', '[]'::jsonb);
  end if;

  if not p_as_admin and v_res.status = 'confirmed'
     and now() > v_session.starts_at - make_interval(mins => v_session.cutoff_minutes) then
    raise exception 'GLF:CANCELLATION_WINDOW_CLOSED' using detail = v_session.cutoff_minutes::text;
  end if;

  update public.reservations
     set status = 'cancelled', cancelled_at = now(), cancelled_by = p_actor_id
   where id = p_reservation_id;

  if v_res.status = 'confirmed' and v_session.status = 'published' and v_session.starts_at > now() then
    v_promoted := private.promote_waitlist(v_res.activity_id, v_res.conference_id, v_session.capacity);
  end if;

  if p_as_admin then
    perform private.audit(p_actor_id, v_res.event_id, 'reservation.cancelled_by_admin', 'reservation',
      p_reservation_id::text, jsonb_build_object('promoted', to_jsonb(v_promoted)));
  end if;

  return jsonb_build_object('cancelled', true, 'promoted', to_jsonb(v_promoted));
end;
$$;

-- -----------------------------------------------------------------------------
-- Cambio de cupo con resolución explícita si queda por debajo de las reservas
--   p_resolution: null | 'keep_existing' | 'move_excess_to_waitlist'
-- -----------------------------------------------------------------------------
create or replace function public.update_session_capacity(
  p_activity_id uuid,
  p_conference_id uuid,
  p_capacity integer,
  p_resolution text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_session private.session_info;
  v_confirmed integer;
  v_moved integer := 0;
  v_promoted uuid[] := '{}';
begin
  if p_capacity is null or p_capacity < 0 then
    raise exception 'GLF:INVALID_CAPACITY';
  end if;

  v_session := private.lock_session(p_activity_id, p_conference_id);
  v_confirmed := private.session_confirmed_count(p_activity_id, p_conference_id);

  if p_capacity < v_confirmed then
    if p_resolution is null then
      raise exception 'GLF:CAPACITY_BELOW_RESERVATIONS' using detail = v_confirmed::text;
    elsif p_resolution = 'move_excess_to_waitlist' then
      -- Las reservas más recientes pasan al frente de la lista de espera.
      with excess as (
        select r.id from public.reservations r
        where r.status = 'confirmed'
          and ((p_activity_id is not null and r.activity_id = p_activity_id)
            or (p_conference_id is not null and r.conference_id = p_conference_id))
        order by r.reserved_at desc, r.id desc
        limit v_confirmed - p_capacity
        for update
      )
      update public.reservations r set status = 'waitlisted'
      from excess e where r.id = e.id;
      get diagnostics v_moved = row_count;
    elsif p_resolution <> 'keep_existing' then
      raise exception 'GLF:INVALID_RESOLUTION';
    end if;
  end if;

  if p_activity_id is not null then
    update public.activities set capacity = p_capacity where id = p_activity_id;
    if v_moved > 0 then
      update public.activities set waitlist_enabled = true where id = p_activity_id;
    end if;
  else
    update public.conferences set capacity = p_capacity where id = p_conference_id;
    if v_moved > 0 then
      update public.conferences set waitlist_enabled = true where id = p_conference_id;
    end if;
  end if;

  if p_capacity > v_confirmed and v_session.status = 'published' and v_session.starts_at > now() then
    v_promoted := private.promote_waitlist(p_activity_id, p_conference_id, p_capacity);
  end if;

  perform private.audit(p_actor_id, v_session.event_id, 'session.capacity_changed', v_session.kind,
    v_session.id::text, jsonb_build_object(
      'from', v_session.capacity, 'to', p_capacity, 'confirmed', v_confirmed,
      'resolution', p_resolution, 'moved_to_waitlist', v_moved, 'promoted', coalesce(array_length(v_promoted, 1), 0)));

  return jsonb_build_object(
    'capacity', p_capacity, 'confirmed', v_confirmed - v_moved + coalesce(array_length(v_promoted, 1), 0),
    'moved_to_waitlist', v_moved, 'promoted', to_jsonb(v_promoted),
    'overbooked', greatest(v_confirmed - v_moved - p_capacity, 0)
  );
end;
$$;

-- Cancela una sesión completa y todas sus reservas activas.
create or replace function public.cancel_session(
  p_activity_id uuid, p_conference_id uuid, p_actor_id uuid
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_session private.session_info;
  v_count integer;
begin
  v_session := private.lock_session(p_activity_id, p_conference_id);

  update public.reservations r
     set status = 'cancelled', cancelled_at = now(), cancelled_by = p_actor_id
   where r.status <> 'cancelled'
     and ((p_activity_id is not null and r.activity_id = p_activity_id)
       or (p_conference_id is not null and r.conference_id = p_conference_id));
  get diagnostics v_count = row_count;

  if p_activity_id is not null then
    update public.activities set status = 'cancelled' where id = p_activity_id;
  else
    update public.conferences set status = 'cancelled' where id = p_conference_id;
  end if;

  perform private.audit(p_actor_id, v_session.event_id, 'session.cancelled', v_session.kind,
    v_session.id::text, jsonb_build_object('reservations_cancelled', v_count));
  return jsonb_build_object('reservations_cancelled', v_count);
end;
$$;

-- Cancela las reservas activas de un boleto (boleto anulado o reembolsado).
create or replace function private.cancel_ticket_reservations(p_ticket_id uuid, p_actor_id uuid)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_res record;
  v_session private.session_info;
  v_count integer := 0;
begin
  for v_res in
    select id, activity_id, conference_id, status from public.reservations
    where ticket_id = p_ticket_id and status <> 'cancelled'
    order by coalesce(activity_id, conference_id)
  loop
    v_session := private.lock_session(v_res.activity_id, v_res.conference_id);
    update public.reservations
       set status = 'cancelled', cancelled_at = now(), cancelled_by = p_actor_id
     where id = v_res.id and status <> 'cancelled';
    if v_res.status = 'confirmed' and v_session.status = 'published' and v_session.starts_at > now() then
      perform private.promote_waitlist(v_res.activity_id, v_res.conference_id, v_session.capacity);
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- Reembolsos (webhook charge.refunded) — idempotente
-- -----------------------------------------------------------------------------
create or replace function public.refund_order_payment(
  p_payment_intent_id text,
  p_amount_refunded_cents integer
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders;
  v_ticket record;
  v_cancelled integer := 0;
begin
  select * into v_order from public.orders where stripe_payment_intent_id = p_payment_intent_id for update;
  if not found then
    return jsonb_build_object('status', 'order_not_found');
  end if;
  if v_order.status = 'refunded' then
    return jsonb_build_object('status', 'already_refunded');
  end if;
  if v_order.status not in ('paid', 'partially_refunded') then
    return jsonb_build_object('status', 'ignored', 'order_status', v_order.status);
  end if;

  if p_amount_refunded_cents >= v_order.total_cents then
    update public.orders set status = 'refunded', refunded_cents = p_amount_refunded_cents where id = v_order.id;
    for v_ticket in
      select t.id from public.tickets t
      join public.order_items oi on oi.id = t.order_item_id
      where oi.order_id = v_order.id and t.status in ('pending_payment', 'valid', 'checked_in')
    loop
      update public.tickets set status = 'refunded' where id = v_ticket.id;
      perform private.cancel_ticket_reservations(v_ticket.id, null);
      v_cancelled := v_cancelled + 1;
    end loop;
    perform private.audit(null, v_order.event_id, 'order.refunded', 'order', v_order.id::text,
      jsonb_build_object('tickets_voided', v_cancelled));
    return jsonb_build_object('status', 'refunded', 'tickets_voided', v_cancelled);
  end if;

  -- Reembolso parcial: no se anula automáticamente ningún boleto; se abre incidencia.
  if p_amount_refunded_cents > v_order.refunded_cents then
    update public.orders set status = 'partially_refunded', refunded_cents = p_amount_refunded_cents where id = v_order.id;
    insert into public.incidents (event_id, category, title, description, priority)
    values (v_order.event_id, 'payment_issue', 'Reembolso parcial por revisar',
      format('El pedido %s recibió un reembolso parcial (%s de %s centavos). Anular manualmente los boletos que correspondan.',
        v_order.reference, p_amount_refunded_cents, v_order.total_cents),
      'high');
    perform private.audit(null, v_order.event_id, 'order.partially_refunded', 'order', v_order.id::text,
      jsonb_build_object('refunded_cents', p_amount_refunded_cents));
  end if;
  return jsonb_build_object('status', 'partially_refunded');
end;
$$;

-- Anulación manual de un boleto por un administrador.
create or replace function public.void_ticket(p_ticket_id uuid, p_actor_id uuid, p_reason text)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_ticket public.tickets;
  v_res integer;
begin
  select * into v_ticket from public.tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'GLF:TICKET_NOT_FOUND';
  end if;
  perform private.assert_staff(p_actor_id, v_ticket.event_id, array['event_admin']::public.staff_role[]);
  if v_ticket.status in ('cancelled', 'refunded') then
    return jsonb_build_object('voided', false, 'status', v_ticket.status);
  end if;

  update public.tickets set status = 'cancelled' where id = p_ticket_id;
  v_res := private.cancel_ticket_reservations(p_ticket_id, p_actor_id);
  perform private.audit(p_actor_id, v_ticket.event_id, 'ticket.voided', 'ticket', p_ticket_id::text,
    jsonb_build_object('reason', left(coalesce(p_reason, ''), 300), 'reservations_cancelled', v_res));
  return jsonb_build_object('voided', true, 'reservations_cancelled', v_res);
end;
$$;

-- -----------------------------------------------------------------------------
-- Check-in atómico
-- -----------------------------------------------------------------------------
create or replace function public.check_in_ticket(
  p_event_id uuid,
  p_staff_id uuid,
  p_qr_token text,
  p_public_code text,
  p_access_area text default 'general',
  p_method text default 'scan'
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_ticket public.tickets;
  v_type public.ticket_types;
  v_updated public.tickets;
  v_result public.check_in_result;
  v_area text := coalesce(nullif(trim(p_access_area), ''), 'general');
  v_order_status public.order_status;
begin
  perform private.assert_staff(p_staff_id, p_event_id,
    array['event_admin', 'ticketing_staff', 'checkin_staff']::public.staff_role[]);

  if p_qr_token is not null then
    select * into v_ticket from public.tickets where qr_token = lower(trim(p_qr_token));
  elsif p_public_code is not null then
    select * into v_ticket from public.tickets where public_code = upper(trim(p_public_code));
  end if;

  if v_ticket.id is null then
    insert into public.check_ins (ticket_id, event_id, staff_id, result, access_area, method)
    values (null, p_event_id, p_staff_id, 'invalid', v_area, p_method);
    return jsonb_build_object('result', 'invalid');
  end if;

  select * into v_type from public.ticket_types where id = v_ticket.ticket_type_id;

  -- Operación atómica: solo una transacción puede pasar el boleto de 'valid' a 'checked_in'.
  update public.tickets t
     set status = 'checked_in', checked_in_at = now()
   where t.id = v_ticket.id
     and t.status = 'valid'
     and t.event_id = p_event_id
     and v_area = any (v_type.access_areas)
     and exists (
       select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
       where oi.id = t.order_item_id and o.status = 'paid'
     )
  returning * into v_updated;

  if v_updated.id is not null then
    v_result := 'accepted';
    v_ticket := v_updated;
  else
    -- Releer el estado actual para explicar el rechazo.
    select * into v_ticket from public.tickets where id = v_ticket.id;
    select o.status into v_order_status from public.order_items oi join public.orders o on o.id = oi.order_id
     where oi.id = v_ticket.order_item_id;

    v_result := case
      when v_ticket.event_id <> p_event_id then 'wrong_event'
      when v_ticket.status = 'checked_in' then 'already_used'
      when v_ticket.status = 'cancelled' then 'cancelled'
      when v_ticket.status = 'refunded' then 'refunded'
      when v_ticket.status = 'pending_payment' or v_order_status is distinct from 'paid' then 'payment_pending'
      when not (v_area = any (v_type.access_areas)) then 'not_allowed'
      else 'invalid'
    end::public.check_in_result;
  end if;

  insert into public.check_ins (ticket_id, event_id, staff_id, result, access_area, method)
  values (v_ticket.id, p_event_id, p_staff_id, v_result, v_area, p_method);

  return jsonb_build_object(
    'result', v_result,
    'ticket', jsonb_build_object(
      'id', v_ticket.id,
      'public_code', v_ticket.public_code,
      'attendee_name', v_ticket.attendee_name,
      'ticket_type', v_type.name,
      'status', v_ticket.status,
      'checked_in_at', v_ticket.checked_in_at
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Venta física / cortesía
-- -----------------------------------------------------------------------------
create or replace function public.create_manual_sale(
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
  p_notes text default null
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
    status, channel, payment_method, paid_at, created_by, notes
  ) values (
    p_event_id, v_user, v_reference, lower(trim(p_buyer_email)), trim(coalesce(p_buyer_name, '')),
    nullif(trim(coalesce(p_buyer_phone, '')), ''), v_total, 'MXN',
    v_status, v_channel, v_method, case when v_status = 'paid' then now() end, p_staff_id,
    nullif(trim(coalesce(p_notes, '')), '')
  ) returning id into v_order_id;

  insert into public.order_items (order_id, ticket_type_id, quantity, unit_price_cents)
  values (v_order_id, p_ticket_type_id, p_quantity, v_unit);

  v_issued := private.issue_tickets(v_order_id, v_ticket_status, p_attendees);

  perform private.audit(p_staff_id, p_event_id,
    case when p_complimentary then 'order.complimentary_issued' else 'order.box_office_sale' end,
    'order', v_order_id::text,
    jsonb_build_object('quantity', p_quantity, 'payment_method', v_method, 'status', v_status,
      'total_cents', v_total, 'ticket_type_id', p_ticket_type_id));

  return jsonb_build_object('order_id', v_order_id, 'reference', v_reference, 'status', v_status,
    'tickets_issued', v_issued, 'total_cents', v_total);
end;
$$;

create or replace function public.confirm_manual_payment(p_order_id uuid, p_staff_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders;
  v_count integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'GLF:ORDER_NOT_FOUND';
  end if;
  perform private.assert_staff(p_staff_id, v_order.event_id,
    array['event_admin', 'ticketing_staff']::public.staff_role[]);
  if v_order.status <> 'awaiting_payment' then
    return jsonb_build_object('updated', false, 'status', v_order.status);
  end if;

  update public.orders set status = 'paid', paid_at = now() where id = p_order_id;
  update public.tickets t set status = 'valid'
    from public.order_items oi
   where oi.id = t.order_item_id and oi.order_id = p_order_id and t.status = 'pending_payment';
  get diagnostics v_count = row_count;

  perform private.audit(p_staff_id, v_order.event_id, 'order.manual_payment_confirmed', 'order',
    p_order_id::text, jsonb_build_object('tickets_validated', v_count));
  return jsonb_build_object('updated', true, 'tickets_validated', v_count);
end;
$$;

-- -----------------------------------------------------------------------------
-- Reclamo de compras como invitado: requiere correo VERIFICADO en Supabase Auth.
-- -----------------------------------------------------------------------------
create or replace function public.claim_guest_tickets(p_user_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_email text;
  v_confirmed timestamptz;
  v_orders integer;
  v_tickets integer;
begin
  select lower(u.email), u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = p_user_id;

  if v_email is null or v_confirmed is null then
    return jsonb_build_object('claimed_orders', 0, 'claimed_tickets', 0, 'reason', 'email_not_verified');
  end if;

  update public.orders set user_id = p_user_id
   where user_id is null and lower(buyer_email) = v_email;
  get diagnostics v_orders = row_count;

  -- Boletos asignados expresamente a este correo, o del comprador sin asignación.
  update public.tickets t set owner_profile_id = p_user_id
   where t.owner_profile_id is null
     and (
       lower(t.attendee_email) = v_email
       or (t.attendee_email is null and exists (
         select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
         where oi.id = t.order_item_id and lower(o.buyer_email) = v_email))
     );
  get diagnostics v_tickets = row_count;

  if v_orders > 0 or v_tickets > 0 then
    perform private.audit(p_user_id, null, 'tickets.claimed', 'profile', p_user_id::text,
      jsonb_build_object('orders', v_orders, 'tickets', v_tickets));
  end if;
  return jsonb_build_object('claimed_orders', v_orders, 'claimed_tickets', v_tickets);
end;
$$;

-- -----------------------------------------------------------------------------
-- Idempotencia de webhooks
-- -----------------------------------------------------------------------------
create or replace function public.begin_stripe_event(p_event_id text, p_type text)
returns boolean   -- true = procesar; false = ya procesado
language plpgsql
set search_path = ''
as $$
declare
  v_processed timestamptz;
begin
  insert into public.stripe_events (id, type) values (p_event_id, p_type)
  on conflict (id) do nothing;
  if found then
    return true;
  end if;

  select processed_at into v_processed from public.stripe_events where id = p_event_id for update;
  if v_processed is not null then
    return false;
  end if;
  update public.stripe_events set attempts = attempts + 1 where id = p_event_id;
  return true;
end;
$$;

create or replace function public.finish_stripe_event(p_event_id text, p_error text default null)
returns void
language sql
set search_path = ''
as $$
  update public.stripe_events
     set processed_at = case when p_error is null then now() else null end,
         last_error = left(p_error, 500)
   where id = p_event_id;
$$;

-- -----------------------------------------------------------------------------
-- Indicadores del dashboard (agregados, sin datos personales)
-- -----------------------------------------------------------------------------
create or replace function public.get_dashboard_stats(p_event_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'capacity', (select max_capacity from public.events where id = p_event_id),
    'tickets_issued', (select count(*) from public.tickets where event_id = p_event_id and status in ('valid', 'checked_in')),
    'tickets_pending_payment', (select count(*) from public.tickets where event_id = p_event_id and status = 'pending_payment'),
    'tickets_total_inventory', (select coalesce(sum(quantity_total), 0) from public.ticket_types where event_id = p_event_id),
    'tickets_held', (select coalesce(sum(oi.quantity), 0) from public.order_items oi join public.orders o on o.id = oi.order_id
                      where o.event_id = p_event_id and o.status = 'pending' and o.expires_at > now()),
    'checked_in', (select count(*) from public.tickets where event_id = p_event_id and status = 'checked_in'),
    'revenue_cents', (select coalesce(sum(total_cents - refunded_cents), 0) from public.orders
                      where event_id = p_event_id and status in ('paid', 'partially_refunded')),
    'revenue_online_cents', (select coalesce(sum(total_cents - refunded_cents), 0) from public.orders
                      where event_id = p_event_id and status in ('paid', 'partially_refunded') and channel = 'online'),
    'revenue_box_office_cents', (select coalesce(sum(total_cents - refunded_cents), 0) from public.orders
                      where event_id = p_event_id and status in ('paid', 'partially_refunded') and channel = 'box_office'),
    'orders_pending', (select count(*) from public.orders where event_id = p_event_id
                      and ((status = 'pending' and expires_at > now()) or status = 'awaiting_payment')),
    'orders_paid', (select count(*) from public.orders where event_id = p_event_id and status = 'paid'),
    'registered_attendees', (select count(distinct owner_profile_id) from public.tickets
                      where event_id = p_event_id and owner_profile_id is not null and status in ('valid', 'checked_in')),
    'incidents_open', (select count(*) from public.incidents where event_id = p_event_id and status in ('open', 'in_progress')),
    'by_ticket_type', (select coalesce(jsonb_agg(x order by x.sort_order), '[]'::jsonb) from (
        select tt.name, tt.sort_order, tt.quantity_total,
          (select count(*) from public.tickets t where t.ticket_type_id = tt.id and t.status in ('valid', 'checked_in')) as sold
        from public.ticket_types tt where tt.event_id = p_event_id) x),
    'sales_by_day', (select coalesce(jsonb_agg(x order by x.day), '[]'::jsonb) from (
        select to_char(paid_at at time zone 'America/Mazatlan', 'YYYY-MM-DD') as day,
               count(*) as orders, sum(total_cents) as revenue_cents
        from public.orders where event_id = p_event_id and status in ('paid', 'partially_refunded') and paid_at is not null
        group by 1) x),
    'activities', (select coalesce(jsonb_agg(x order by x.starts_at), '[]'::jsonb) from (
        select a.id, a.name, a.starts_at, a.capacity,
          (select count(*) from public.reservations r where r.activity_id = a.id and r.status = 'confirmed') as confirmed,
          (select count(*) from public.reservations r where r.activity_id = a.id and r.status = 'waitlisted') as waitlisted
        from public.activities a where a.event_id = p_event_id and a.status <> 'draft') x),
    'conferences', (select coalesce(jsonb_agg(x order by x.starts_at), '[]'::jsonb) from (
        select c.id, c.title as name, c.starts_at, c.capacity, c.requires_reservation,
          (select count(*) from public.reservations r where r.conference_id = c.id and r.status = 'confirmed') as confirmed,
          (select count(*) from public.reservations r where r.conference_id = c.id and r.status = 'waitlisted') as waitlisted
        from public.conferences c where c.event_id = p_event_id and c.status <> 'draft') x)
  );
$$;

-- Disponibilidad de sesiones (solo conteos).
create or replace function public.get_session_availability(p_event_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'activities', (select coalesce(jsonb_object_agg(a.id, jsonb_build_object(
        'capacity', a.capacity,
        'confirmed', (select count(*) from public.reservations r where r.activity_id = a.id and r.status = 'confirmed'),
        'waitlisted', (select count(*) from public.reservations r where r.activity_id = a.id and r.status = 'waitlisted'))), '{}'::jsonb)
      from public.activities a where a.event_id = p_event_id),
    'conferences', (select coalesce(jsonb_object_agg(c.id, jsonb_build_object(
        'capacity', c.capacity,
        'confirmed', (select count(*) from public.reservations r where r.conference_id = c.id and r.status = 'confirmed'),
        'waitlisted', (select count(*) from public.reservations r where r.conference_id = c.id and r.status = 'waitlisted'))), '{}'::jsonb)
      from public.conferences c where c.event_id = p_event_id)
  );
$$;

-- -----------------------------------------------------------------------------
-- Privilegios: solo el servidor (service_role) ejecuta estas funciones.
-- -----------------------------------------------------------------------------
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
grant execute on all functions in schema private to service_role;

alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
