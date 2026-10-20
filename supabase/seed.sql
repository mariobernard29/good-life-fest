-- =============================================================================
-- DATOS DE DEMOSTRACIÓN — SOLO PARA DESARROLLO
--
-- Fechas, precios, instructores, ponentes, patrocinadores y expositores son
-- FICTICIOS y sirven para probar la plataforma. No representan información
-- oficial del festival. El evento queda marcado con settings.is_demo = true y el
-- sitio muestra un aviso mientras esa bandera esté activa.
--
-- `supabase db reset` ejecuta este archivo automáticamente en local.
-- Para un proyecto remoto de desarrollo: pegar en el SQL Editor.
-- NUNCA ejecutar en producción.
-- =============================================================================

do $$
declare
  v_event uuid;
  d1 date := date '2027-01-24';  -- domingo 24 de enero de 2027 (fecha tentativa, un solo día)
  tz text := 'America/Mazatlan';
begin
  if exists (select 1 from public.events where slug = 'good-life-wellness-fest') then
    raise notice 'Los datos de demostración ya existen; no se insertan de nuevo.';
    return;
  end if;

  insert into public.events (name, slug, description, location_name, address, starts_at, ends_at, timezone, max_capacity, status, settings)
  values (
    'Good Life Wellness Fest',
    'good-life-wellness-fest',
    'Un día completo de bienestar junto al agua: clases, conferencias, experiencias, retos y un mercado de marcas de bienestar.',
    'Lago Ávila',
    'Los Mochis, Sinaloa, México',
    (d1 + time '06:30') at time zone tz,
    (d1 + time '18:00') at time zone tz,
    tz,
    800,
    'published',
    jsonb_build_object(
      'is_demo', true,
      'online_sales_enabled', true,
      'reservations_open', true,
      'max_reservations_per_ticket', 6,
      'contact_email', 'hola@ejemplo.com',
      'hero_tagline', 'Muévete, respira y reconecta junto al lago'
    )
  ) returning id into v_event;

  insert into public.ticket_types (event_id, name, description, price_cents, quantity_total, max_per_order, benefits, access_areas, sale_status, sort_order) values
    (v_event, 'Pase General', 'Acceso al festival de 6:30 a 18:00 h.', 180000, 650, 6,
      array['Acceso todo el día', 'Reserva de clases y conferencias'], array['general'], 'on_sale', 1),
    (v_event, 'Pase VIP', 'Experiencia completa con zona lounge y amenidades.', 350000, 80, 4,
      array['Acceso todo el día', 'Zona lounge VIP', 'Brunch de autor', 'Reserva prioritaria'], array['general', 'vip'], 'on_sale', 2),
    (v_event, 'Cortesía / Staff aliado', 'Uso interno: cortesías y acreditaciones.', 0, 70, 10,
      array['Acceso general'], array['general'], 'box_office_only', 9);

  insert into public.activities (event_id, name, category, description, instructor, starts_at, ends_at, location, capacity, status, requires_ticket, waitlist_enabled, cancellation_cutoff_minutes) values
    (v_event, 'Yoga al amanecer', 'Yoga', 'Vinyasa suave para despertar el cuerpo frente al lago. Todos los niveles.', 'Instructora demo · Mariana', (d1 + time '06:45') at time zone tz, (d1 + time '07:45') at time zone tz, 'Muelle principal', 40, 'published', true, true, 60),
    (v_event, 'Breathwork consciente', 'Respiración', 'Técnicas de respiración para regular el sistema nervioso.', 'Facilitador demo · Diego', (d1 + time '08:00') at time zone tz, (d1 + time '09:00') at time zone tz, 'Jardín de palmeras', 30, 'published', true, false, 60),
    (v_event, 'Pilates mat', 'Pilates', 'Core, postura y control.', 'Instructora demo · Sofía', (d1 + time '08:30') at time zone tz, (d1 + time '09:30') at time zone tz, 'Muelle principal', 35, 'published', true, false, 60),
    (v_event, 'Funcional al aire libre', 'Movimiento', 'Circuito de fuerza y movilidad con peso corporal.', 'Coach demo · Ana', (d1 + time '10:00') at time zone tz, (d1 + time '11:00') at time zone tz, 'Explanada', 50, 'published', true, true, 60),
    (v_event, 'Taller de cocina consciente', 'Taller', 'Recetas de temporada con ingredientes locales.', 'Chef demo · Pablo', (d1 + time '13:00') at time zone tz, (d1 + time '14:30') at time zone tz, 'Pabellón de cristal', 20, 'published', true, true, 180),
    (v_event, 'Baño de sonido', 'Meditación', 'Cuencos y gong para un descanso profundo.', 'Terapeuta demo · Lucía', (d1 + time '16:45') at time zone tz, (d1 + time '17:45') at time zone tz, 'Pabellón de cristal', 25, 'published', true, true, 120);

  insert into public.conferences (event_id, title, description, speaker_name, speaker_bio, starts_at, ends_at, location, capacity, requires_reservation, status) values
    (v_event, 'Hábitos que sí se sostienen', 'Ciencia del comportamiento aplicada al bienestar diario.', 'Ponente demo · Dra. Valeria', 'Biografía de demostración.', (d1 + time '11:30') at time zone tz, (d1 + time '12:30') at time zone tz, 'Pabellón de cristal', 120, true, 'published'),
    (v_event, 'Nutrición sin extremos', 'Cómo comer bien sin dietas restrictivas.', 'Ponente demo · Lic. Andrés', 'Biografía de demostración.', (d1 + time '15:00') at time zone tz, (d1 + time '16:00') at time zone tz, 'Pabellón de cristal', 120, false, 'published'),
    (v_event, 'Descanso y longevidad', 'El sueño como pilar de la salud.', 'Ponente demo · Dr. Martín', 'Biografía de demostración.', (d1 + time '09:30') at time zone tz, (d1 + time '10:30') at time zone tz, 'Pabellón de cristal', 100, true, 'published');

  insert into public.sponsors (event_id, name, tier, description, sort_order, is_published) values
    (v_event, 'Patrocinador Demo A', 'presenta', 'Marca de demostración.', 1, true),
    (v_event, 'Patrocinador Demo B', 'aliado', 'Marca de demostración.', 2, true),
    (v_event, 'Patrocinador Demo C', 'aliado', 'Marca de demostración.', 3, true);

  insert into public.exhibitors (event_id, name, category, description, booth, sort_order, is_published) values
    (v_event, 'Expositor Demo · Café de especialidad', 'Alimentos', 'Marca de demostración.', 'A1', 1, true),
    (v_event, 'Expositor Demo · Ropa deportiva', 'Moda', 'Marca de demostración.', 'A2', 2, true),
    (v_event, 'Expositor Demo · Cosmética natural', 'Cuidado personal', 'Marca de demostración.', 'B1', 3, true),
    (v_event, 'Expositor Demo · Suplementos', 'Nutrición', 'Marca de demostración.', 'B2', 4, true);

  insert into public.faqs (event_id, question, answer, sort_order) values
    (v_event, '¿Cómo recibo mi entrada?', 'Compra en un punto de venta o por mensaje. Al registrarte te llega un correo para crear tu contraseña; tus entradas aparecerán en “Mi cuenta” con un código QR individual.', 1),
    (v_event, '¿Necesito reservar las clases?', 'Sí. Las clases tienen cupo limitado y se reservan desde “Mi cuenta” con una entrada válida. Algunas conferencias son de acceso libre.', 2),
    (v_event, '¿Puedo cancelar una reserva?', 'Sí, hasta el plazo indicado en cada clase. Al cancelar, el lugar se libera para otra persona.', 3),
    (v_event, '¿Qué debo llevar?', 'Ropa cómoda, tapete si lo prefieres, botella reutilizable y protector solar.', 4),
    (v_event, '¿Hay reembolsos?', 'Consulta la política de reembolsos vigente con el equipo organizador. (Texto de demostración.)', 5);

  insert into public.announcements (event_id, title, body) values
    (v_event, 'Bienvenida', 'Este es un aviso de demostración. Aquí el equipo publicará novedades del festival.');
end $$;
