-- Ajusta el evento de demostración a un solo día: domingo 17 de enero de 2027, 8:00 a 21:00 (Los Mochis).
-- Pegar en Supabase → SQL Editor del proyecto «Good Life Fest» y ejecutar. Es idempotente.
do $$
declare
  ev uuid;
  d date := date '2027-01-17';
  tz text := 'America/Mazatlan';
begin
  select id into ev from public.events where slug = 'good-life-wellness-fest';

  update public.events set
    starts_at = (d + time '08:00') at time zone tz,
    ends_at   = (d + time '21:00') at time zone tz,
    description = 'Un día completo de bienestar junto al agua: clases, conferencias, experiencias, retos y un mercado de marcas de bienestar.'
  where id = ev;

  update public.ticket_types set name = 'Pase General', description = 'Acceso al festival de 8:00 a 21:00 h.', quantity_total = 650,
    benefits = array['Acceso todo el día', 'Reserva de clases y conferencias', 'Kit de bienvenida']
  where event_id = ev and name = 'Pase Fin de Semana';
  update public.ticket_types set benefits = array['Acceso todo el día', 'Zona lounge VIP', 'Brunch de autor', 'Reserva prioritaria']
  where event_id = ev and name = 'Pase VIP';
  delete from public.ticket_types where event_id = ev and name = 'Pase Sábado';

  update public.activities a set starts_at = (d + x.s) at time zone tz, ends_at = (d + x.e) at time zone tz
  from (values ('Yoga al amanecer', time '08:15', time '09:15'),
               ('Breathwork consciente', time '09:30', time '10:30'),
               ('Pilates mat', time '10:00', time '11:00'),
               ('Funcional al aire libre', time '11:30', time '12:30'),
               ('Taller de cocina consciente', time '14:15', time '15:45'),
               ('Baño de sonido', time '18:00', time '19:00')) as x(n, s, e)
  where a.event_id = ev and a.name = x.n;

  update public.conferences c set starts_at = (d + x.s) at time zone tz, ends_at = (d + x.e) at time zone tz
  from (values ('Hábitos que sí se sostienen', time '13:00', time '14:00'),
               ('Nutrición sin extremos', time '16:00', time '17:00'),
               ('Descanso y longevidad', time '10:00', time '11:00')) as x(n, s, e)
  where c.event_id = ev and c.title = x.n;
end $$;

-- Verificación
select e.starts_at at time zone 'America/Mazatlan' as inicio, e.ends_at at time zone 'America/Mazatlan' as fin,
  (select string_agg(name, ', ' order by sort_order) from public.ticket_types where event_id = e.id) as tipos
from public.events e where slug = 'good-life-wellness-fest';
