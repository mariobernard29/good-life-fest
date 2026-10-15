-- =============================================================================
-- claim_guest_tickets: ejecutar con los privilegios de su dueño
--
-- La función lee auth.users (correo y si está verificado). En Supabase alojado el
-- rol service_role NO tiene SELECT sobre auth.users, así que fallaba con
-- "permission denied for table users" en cada inicio de sesión y en /auth/callback.
-- Como SECURITY DEFINER corre con los privilegios del dueño (postgres); ya fija
-- search_path = '' y sigue siendo ejecutable solo por service_role.
-- =============================================================================

alter function public.claim_guest_tickets(uuid) security definer;

revoke all on function public.claim_guest_tickets(uuid) from public, anon, authenticated;
grant execute on function public.claim_guest_tickets(uuid) to service_role;
