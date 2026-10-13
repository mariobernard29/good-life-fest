-- El asistente puede ver el tipo de entrada de sus propios boletos aunque ese tipo
-- no esté a la venta (p. ej. cortesías o tipos exclusivos de taquilla).
create policy "Tipos de entrada de mis boletos" on public.ticket_types for select to authenticated
  using (exists (
    select 1 from public.tickets t
    where t.ticket_type_id = ticket_types.id and t.owner_profile_id = (select auth.uid())
  ));
