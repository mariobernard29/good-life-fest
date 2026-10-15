-- =============================================================================
-- Aviso push cuando una reserva en lista de espera pasa a confirmada
--
-- private.promote_waitlist (cancelación, ampliación de cupo, boleto anulado o
-- reembolsado) confirma la reserva y fija promoted_at. El servidor reclama esas
-- reservas con claim_promoted_reservations y envía "¡Se liberó un lugar!":
--   * de inmediato, desde la acción que liberó el lugar (con los ids promovidos);
--   * cada minuto, desde el despachador (/api/webhooks/notificaciones), que
--     recoge cualquier promoción que no se haya avisado.
--
--   * reservations.promotion_notified_at  aviso de promoción ya enviado.
--
-- Una reserva puede volver a la lista de espera (update_session_capacity con
-- 'move_excess_to_waitlist') y promoverse otra vez: promoted_at se actualiza y
-- queda más reciente que promotion_notified_at, así que cada promoción se avisa
-- una sola vez.
-- =============================================================================

alter table public.reservations
  add column promotion_notified_at timestamptz;

-- Solo las reservas promovidas y confirmadas son candidatas a aviso.
create index reservations_promoted_idx on public.reservations (event_id)
  where status = 'confirmed' and promoted_at is not null;

-- -----------------------------------------------------------------------------
-- Toma (y marca) las reservas promovidas pendientes de aviso cuya sesión
-- publicada todavía no empieza. Con p_reservation_ids se limita a esas reservas
-- (envío inmediato tras liberar un lugar). SKIP LOCKED + la marca
-- promotion_notified_at garantizan un solo aviso por promoción aunque el
-- despachador y la acción corran en paralelo.
-- -----------------------------------------------------------------------------
create or replace function public.claim_promoted_reservations(
  p_event_id uuid,
  p_reservation_ids uuid[] default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_rows jsonb;
begin
  with due as (
    select r.id
      from public.reservations r
      left join public.activities a on a.id = r.activity_id
      left join public.conferences c on c.id = r.conference_id
     where r.event_id = p_event_id
       and r.status = 'confirmed'
       and r.promoted_at is not null
       and (r.promotion_notified_at is null or r.promotion_notified_at < r.promoted_at)
       and (p_reservation_ids is null or r.id = any (p_reservation_ids))
       and coalesce(a.status, c.status) = 'published'
       and coalesce(a.starts_at, c.starts_at) > now()
       for update of r skip locked
  ), claimed as (
    update public.reservations r
       set promotion_notified_at = now()
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
-- Privilegios: igual que en 0300, solo el servidor ejecuta las funciones.
-- -----------------------------------------------------------------------------
revoke all on function public.claim_promoted_reservations(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.claim_promoted_reservations(uuid, uuid[]) to service_role;
