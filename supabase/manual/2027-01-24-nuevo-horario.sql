-- Cambia el evento al domingo 24 de enero de 2027, de 6:30 a 18:00 (Los Mochis),
-- y acomoda las clases/conferencias de demostración dentro de ese horario.
-- Pegar en Supabase → SQL Editor del proyecto «Good Life Fest» y ejecutar. Es idempotente.
do $$
declare
  ev uuid;
  d date := date '2027-01-24';
  tz text := 'America/Mazatlan';
begin
  select id into ev from public.events where slug = 'good-life-wellness-fest';

  update public.events set
    starts_at = (d + time '06:30') at time zone tz,
    ends_at   = (d + time '18:00') at time zone tz
  where id = ev;

  update public.ticket_types set description = 'Acceso al festival de 6:30 a 18:00 h.'
  where event_id = ev and name = 'Pase General';

  -- Clases de demostración con horario fijo.
  update public.activities a set starts_at = (d + x.s) at time zone tz, ends_at = (d + x.e) at time zone tz
  from (values ('Yoga al amanecer', time '06:45', time '07:45'),
               ('Breathwork consciente', time '08:00', time '09:00'),
               ('Pilates mat', time '08:30', time '09:30'),
               ('Funcional al aire libre', time '10:00', time '11:00'),
               ('Taller de cocina consciente', time '13:00', time '14:30'),
               ('Baño de sonido', time '16:45', time '17:45')) as x(n, s, e)
  where a.event_id = ev and a.name = x.n;

  update public.conferences c set starts_at = (d + x.s) at time zone tz, ends_at = (d + x.e) at time zone tz
  from (values ('Descanso y longevidad', time '09:30', time '10:30'),
               ('Hábitos que sí se sostienen', time '11:30', time '12:30'),
               ('Nutrición sin extremos', time '15:00', time '16:00')) as x(n, s, e)
  where c.event_id = ev and c.title = x.n;

  -- Cualquier otra sesión que siga en otra fecha se mueve al 24 conservando su hora.
  update public.activities set
    starts_at = (d + (starts_at at time zone tz)::time) at time zone tz,
    ends_at   = (d + (ends_at at time zone tz)::time) at time zone tz
  where event_id = ev and (starts_at at time zone tz)::date <> d;
  update public.conferences set
    starts_at = (d + (starts_at at time zone tz)::time) at time zone tz,
    ends_at   = (d + (ends_at at time zone tz)::time) at time zone tz
  where event_id = ev and (starts_at at time zone tz)::date <> d;
end $$;

-- Verificación: todas deben caer el 24 entre 6:30 y 18:00 («fuera_de_horario» = false).
select 'clase' as tipo, name as nombre, starts_at at time zone 'America/Mazatlan' as inicio, ends_at at time zone 'America/Mazatlan' as fin,
  (starts_at at time zone 'America/Mazatlan')::time < time '06:30' or (ends_at at time zone 'America/Mazatlan')::time > time '18:00' as fuera_de_horario
from public.activities where event_id = (select id from public.events where slug = 'good-life-wellness-fest')
union all
select 'conferencia', title, starts_at at time zone 'America/Mazatlan', ends_at at time zone 'America/Mazatlan',
  (starts_at at time zone 'America/Mazatlan')::time < time '06:30' or (ends_at at time zone 'America/Mazatlan')::time > time '18:00'
from public.conferences where event_id = (select id from public.events where slug = 'good-life-wellness-fest')
order by inicio;
