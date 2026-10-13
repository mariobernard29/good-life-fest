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

Pruebas (`npm test`, 28 pruebas con PostgreSQL real vía PGlite) cubren inventario, emisión idempotente,
concurrencia, reservas, lista de espera, check-in, permisos y aislamiento de datos entre usuarios.
`npm run test:remote` ejecuta pruebas de concurrencia real contra el proyecto de Supabase de desarrollo
(crea y borra sus propios datos).

Primer administrador (cuando se active el panel):

```bash
npm run admin:create -- tu-correo@dominio.com
```
