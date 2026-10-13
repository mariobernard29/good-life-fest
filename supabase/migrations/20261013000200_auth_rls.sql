-- =============================================================================
-- Autenticación, Row Level Security y privilegios
--
-- Modelo:
--   * anon/authenticated solo LEEN contenido público y sus propios datos.
--   * Ninguna escritura directa desde el navegador salvo nombre/teléfono del perfil.
--   * Toda operación de negocio pasa por el servidor (service_role) que valida
--     permisos y llama a las funciones transaccionales de la migración 0300.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Perfil automático al registrarse
-- -----------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    -- full_name/phone son datos de presentación; nunca se usan para autorizar.
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 30), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function private.handle_user_email_change();

revoke all on all functions in schema private from public;
revoke usage on schema private from public;

-- -----------------------------------------------------------------------------
-- RLS en todas las tablas expuestas
-- -----------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.events           enable row level security;
alter table public.ticket_types     enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.tickets          enable row level security;
alter table public.activities       enable row level security;
alter table public.conferences      enable row level security;
alter table public.reservations     enable row level security;
alter table public.event_staff      enable row level security;
alter table public.check_ins        enable row level security;
alter table public.incidents        enable row level security;
alter table public.incident_updates enable row level security;
alter table public.audit_logs       enable row level security;
alter table public.stripe_events    enable row level security;
alter table public.sponsors         enable row level security;
alter table public.exhibitors       enable row level security;
alter table public.faqs             enable row level security;
alter table public.announcements    enable row level security;

-- Privilegios base: quitar todo a los roles públicos y conceder lo mínimo.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- --- Contenido público --------------------------------------------------------
grant select on public.events, public.ticket_types, public.activities, public.conferences,
  public.sponsors, public.exhibitors, public.faqs, public.announcements
  to anon, authenticated;

create policy "Eventos visibles" on public.events for select to anon, authenticated
  using (status in ('published', 'closed'));

create policy "Tipos de entrada visibles" on public.ticket_types for select to anon, authenticated
  using (
    sale_status in ('on_sale', 'paused', 'closed')
    and exists (select 1 from public.events e where e.id = event_id and e.status in ('published', 'closed'))
  );

create policy "Actividades publicadas" on public.activities for select to anon, authenticated
  using (status in ('published', 'closed', 'cancelled'));

create policy "Conferencias publicadas" on public.conferences for select to anon, authenticated
  using (status in ('published', 'closed', 'cancelled'));

create policy "Patrocinadores publicados" on public.sponsors for select to anon, authenticated
  using (is_published);

create policy "Expositores publicados" on public.exhibitors for select to anon, authenticated
  using (is_published);

create policy "FAQ publicadas" on public.faqs for select to anon, authenticated
  using (is_published);

create policy "Avisos publicados" on public.announcements for select to anon, authenticated
  using (is_published);

-- --- Datos propios del asistente ---------------------------------------------
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy "Perfil propio: lectura" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Perfil propio: edición" on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select on public.orders, public.order_items, public.tickets, public.reservations to authenticated;

create policy "Pedidos propios" on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Partidas de pedidos propios" on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())
  ));

create policy "Boletos propios" on public.tickets for select to authenticated
  using ((select auth.uid()) = owner_profile_id);

create policy "Reservas propias" on public.reservations for select to authenticated
  using ((select auth.uid()) = profile_id);

-- --- Rol propio de personal (para que la sesión conozca su alcance) ----------
grant select on public.event_staff to authenticated;

create policy "Rol propio" on public.event_staff for select to authenticated
  using ((select auth.uid()) = user_id and is_active);

-- check_ins, incidents, incident_updates, audit_logs y stripe_events no tienen
-- políticas para anon/authenticated: solo el servidor (service_role) accede a ellos
-- después de verificar permisos en la capa de autorización.
