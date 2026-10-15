-- Programa el despachador de notificaciones push: cada minuto, Supabase llama a
-- POST <SITIO>/api/webhooks/notificaciones con el secreto CRON_SECRET. El sitio envía
-- los recordatorios de clases y los avisos programados que ya deben salir.
--
-- Cuándo correrlo: DESPUÉS de publicar el sitio con las variables VAPID y CRON_SECRET.
-- Cómo: Supabase → SQL Editor del proyecto «Good Life Fest». Antes de ejecutar, reemplaza
--   1) https://TU-DOMINIO.mx       por la URL pública del sitio (sin / al final)
--   2) PEGA-AQUI-TU-CRON-SECRET    por el mismo valor de CRON_SECRET del hosting
-- Es idempotente: si ya existe, actualiza el secreto y la tarea.
-- (No va en supabase/migrations: las pruebas locales con PGlite no tienen pg_cron.)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- El secreto se guarda cifrado en Vault (nunca en el texto de la tarea).
do $$
begin
  if exists (select 1 from vault.secrets where name = 'glf_cron_secret') then
    perform vault.update_secret(
      (select id from vault.secrets where name = 'glf_cron_secret'),
      'PEGA-AQUI-TU-CRON-SECRET');
  else
    perform vault.create_secret('PEGA-AQUI-TU-CRON-SECRET', 'glf_cron_secret', 'Secreto del despachador de notificaciones');
  end if;
end $$;

select cron.unschedule('glf-notificaciones')
where exists (select 1 from cron.job where jobname = 'glf-notificaciones');

select cron.schedule(
  'glf-notificaciones',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://TU-DOMINIO.mx/api/webhooks/notificaciones',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'glf_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $job$
);

-- Verificar:
--   select jobid, jobname, schedule, active from cron.job;
--   select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
--   select status_code, content, created from net._http_response order by created desc limit 5;
-- Pausar después del festival:
--   select cron.unschedule('glf-notificaciones');
