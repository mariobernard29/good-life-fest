# Good Life Wellness Fest

**Vive mejor. Muévete mejor. Siéntete mejor.**
Sitio del festival de bienestar en el **Lago Ávila, Los Mochis, Sinaloa**.

## Estado actual: sitio visual

Por decisión del equipo, **por ahora el proyecto es meramente visual**:

- El sitio público muestra el concepto oficial del festival (pilares, zonas, programa por bloques, Good Life Stage,
  marcas, boletos «próximamente» y preguntas frecuentes). Todo el texto vive en `src/content/festival.ts`.
- **No hay pasarela de pago.** Stripe se retiró del código, de las dependencias y de las variables de entorno.
  La página `/entradas` anuncia el lanzamiento de boletos.
- Las páginas públicas **no consultan la base de datos**: funcionan aunque Supabase no esté configurado.
- No se inventan datos: fecha, precios, paquetes, speakers y marcas aparecen como «por anunciar».

### Fotografías

- Fotos reales de la sede (`public/images/`, tomadas de `recursos/`).
- Fotos de referencia de **Unsplash** (licencia de uso libre; solo fotos gratuitas, no «Unsplash+»), listadas en
  `src/content/images.ts` con su autor. Se sirven desde el CDN de Unsplash redimensionadas al tamaño de pantalla.
  Para cambiar una foto, reemplaza su `id` en ese archivo; idealmente sustitúyelas por fotografía propia del festival.

## Desarrollo

Requisitos: Node.js 20.9+ (probado con 24).

```bash
npm install
```

```bash
npm run dev
```

Abre http://localhost:3000. Otros scripts: `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`.

### Estructura

```
src/
  content/           textos oficiales (festival.ts) y fotografías (images.ts)
  app/(public)/      /, /experiencias, /programa, /conferencias (Good Life Stage),
                     /expositores (marcas), /entradas (próximamente), /faq
  components/site/   encabezado, pie, bloques visuales (Photo, Mosaic, PhotoCard, Marquee…)
```

Identidad: logotipo original (solo recortado), paleta crema / verde oliva / salvia / negro suave con acento dorado
del atardecer en el lago, tipografías Cormorant Garamond (titulares) y Manrope (texto).

## Operación de venta y registro

Las entradas se venden **solo en puntos físicos o por mensaje** (WhatsApp / DM). No hay compra en línea ni registro
libre: `/comprar` y `/registro` siguen en el código pero están desactivados con `FEST.onlineSales` y
`FEST.selfSignup` en `src/content/festival.ts`. Los puntos de venta y el WhatsApp se capturan en `TICKET_SALES`
del mismo archivo; con `FEST.salesOpen = true` aparecen en `/entradas`.

1. **Registro manual** (`/admin/asistentes/nuevo`, permiso de taquilla): nombre, correo, teléfono, edad, tipo de
   entrada, pago y si compró en punto físico o por mensaje. Se crea la cuenta, se emite la entrada ya vinculada y se
   envía un correo (Resend) con el enlace para activar la cuenta.
2. **Activación** (`/completar-registro`): la persona crea su contraseña y entra a `/mi-cuenta`. Si el enlace venció,
   lo pide de nuevo en «¿Olvidaste tu contraseña?» o el personal usa «Reenviar correo» en Asistentes.
3. **Reservas**: en el portal aparta su lugar en clases y actividades.
4. **Pulsera**: en punto físico queda «entregada»; por mensaje queda «pendiente». Se marca en Asistentes o en el
   check-in al escanear el QR. El dashboard muestra cuántas siguen pendientes.
5. **Notificaciones push**: el portal pide permiso (en iPhone hay que agregarlo a la pantalla de inicio). Llegan
   recordatorios N minutos antes de cada clase reservada, el aviso «¡Se liberó un lugar!» cuando una reserva sale
   de la lista de espera y los avisos que el personal programa en `/admin/notificaciones`.
6. **Respaldos** (solo administradores): Excel y PDF de participantes (nombre, correo y pulsera, en orden alfabético)
   desde Asistentes, y de asistencia por clase desde Reservas o desde cada clase.

### Configuración pendiente para producción

- **Resend**: crear cuenta, verificar el dominio y definir `RESEND_API_KEY` y `EMAIL_FROM`. Sin ellas, en desarrollo
  el enlace de activación se imprime en la consola y se muestra al personal.
- **Notificaciones**: `npx web-push generate-vapid-keys` → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  `VAPID_SUBJECT`; definir `CRON_SECRET` y, ya publicado el sitio, ejecutar
  `supabase/manual/2026-10-15-cron-notificaciones.sql` en el SQL Editor.
- **Supabase → Authentication**: desactivar «Allow new users to sign up» (las cuentas las crea el servidor), poner la
  URL del sitio en *Site URL* y `https://<dominio>/auth/callback` en *Redirect URLs*, y subir la vigencia de los
  enlaces de correo (*Email OTP expiration*) a 24 h.
- Aplicar las migraciones `supabase/migrations/20261015000100_registro_manual_pulseras_push.sql` y
  `supabase/migrations/20261015000200_aviso_lista_espera.sql`.

## Base preparada para la siguiente etapa (no enlazada desde el sitio)

El repositorio conserva, sin enlaces desde el sitio público, la base operativa construida en la primera etapa para
retomarla cuando se defina la venta:

- **Supabase** (proyecto «Good Life Fest», `btrhucveuobypzsgqtqi` — el único proyecto que usa esta app):
  esquema, Row Level Security y funciones transaccionales de inventario, boletos QR, reservas de clases,
  check-in y ventas de taquilla (`supabase/migrations/`), más datos de demostración (`supabase/seed.sql`).
- Autenticación (`/login`, `/registro`), portal del asistente (`/mi-cuenta`), panel (`/admin`) y control de
  acceso (`/check-in`). Requieren `.env.local` con las llaves de Supabase (ver `.env.example`).
- Las funciones de pedidos son independientes del proveedor de pago: al integrar una pasarela solo hay que
  llamar a `create_order_hold` al iniciar la compra y a `fulfill_order_payment` cuando el proveedor confirme el pago.

Pruebas (`npm test`, con PostgreSQL real vía PGlite) cubren inventario, emisión idempotente, concurrencia, reservas,
lista de espera, check-in, pulseras, cola de notificaciones, exportaciones, permisos y aislamiento de datos entre usuarios.
`npm run test:remote` ejecuta pruebas de concurrencia real contra el proyecto de Supabase de desarrollo
(crea y borra sus propios datos).

Primer administrador (cuando se active el panel):

```bash
npm run admin:create -- tu-correo@dominio.com
```
