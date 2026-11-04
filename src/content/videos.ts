/**
 * Videos del sitio (carpeta /public/videos, comprimidos para web y sin audio salvo el promo).
 *  - Clips de stock: Mixkit (licencia libre, sin atribución obligatoria). Sustitúyelos por
 *    material propio del festival cuando exista.
 *  - `promo`: video promocional propio de Good Life.
 */
export type Clip = { src: string; poster: string };

const v = (name: string): Clip => ({ src: `/videos/${name}.mp4`, poster: `/videos/${name}.jpg` });

export const VID = {
  yogaDeck: v("yoga-muelle"),
  yogaSunset: v("yoga-atardecer"),
  crowd: v("publico"),
  lakeSunset: v("lago-atardecer"),
  sunSalute: v("saludo-sol"),
  meditation: v("meditacion"),
  stretch: v("estiramiento"),
  runner: v("corredor"),
  promo: v("promo"),
} satisfies Record<string, Clip>;

export const HERO_REEL: Clip[] = [VID.yogaDeck, VID.lakeSunset, VID.yogaSunset, VID.crowd];

/** Un día en Good Life: del amanecer al atardecer. */
export const DAY_REEL: { clip: Clip; time: string; title: string }[] = [
  { clip: VID.sunSalute, time: "Amanecer", title: "Saluda al sol" },
  { clip: VID.runner, time: "Mañana", title: "Muévete" },
  { clip: VID.stretch, time: "Tarde", title: "Recupera" },
  { clip: VID.meditation, time: "Atardecer", title: "Respira" },
];
