import { IMG, type Photo } from "@/content/images";

/**
 * Good Life Wellness: la marca paraguas. Comunidad en redes, eventos, ropa y
 * accesorios. Good Life Wellness Fest es uno de sus eventos (ver content/festival.ts).
 */
export const BRAND = {
  name: "Good Life Wellness",
  tagline: "Live the Good Life.",
  lead: "Una marca de bienestar y estilo de vida nacida en Los Mochis: comunidad, eventos, ropa y experiencias para vivir mejor todos los días.",
  city: "Los Mochis, Sinaloa",
  instagramUrl: "https://www.instagram.com/goodlifewellnesslm/",
  instagramHandle: "@goodlifewellnesslm",
  words: ["Comunidad", "Movimiento", "Nutrición", "Mind", "Eventos", "Apparel", "Lifestyle", "Recovery"],
};

export const BRAND_NAV = [
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#comunidad", label: "Comunidad" },
  { href: "/#eventos", label: "Eventos" },
  { href: "/#shop", label: "Shop" },
  { href: "/festival", label: "Wellness Fest" },
];

export const MANIFESTO = {
  title: "Una buena vida empieza por cómo decides vivirla.",
  body: [
    "Good Life Wellness es más que un evento: es una forma de vivir. Reunimos a personas que quieren moverse más, comer mejor, descansar de verdad y rodearse de gente que suma.",
    "Lo hacemos en redes, en la calle, en el gimnasio, frente al lago y en todo lo que llevas puesto.",
  ],
};

export const WHAT_WE_DO: { id: string; title: string; text: string; photo: Photo; href: string; cta: string }[] = [
  {
    id: "comunidad",
    title: "Comunidad",
    text: "Contenido, retos, tips y gente con la misma intención. Todo empieza en nuestro Instagram.",
    photo: IMG.handsUp,
    href: "#comunidad",
    cta: "Únete",
  },
  {
    id: "eventos",
    title: "Eventos",
    text: "Experiencias de bienestar en vivo: clases, encuentros y nuestro festival en el Lago Ávila.",
    photo: IMG.yogaPark,
    href: "#eventos",
    cta: "Ver eventos",
  },
  {
    id: "shop",
    title: "Ropa y accesorios",
    text: "Good Life Apparel: prendas y accesorios para entrenar, moverte y vivir el lifestyle.",
    photo: IMG.apparel,
    href: "#shop",
    cta: "Próximamente",
  },
  {
    id: "marcas",
    title: "Alianzas",
    text: "Marcas, gimnasios y profesionales que comparten la visión de vivir mejor.",
    photo: IMG.expo,
    href: "#alianzas",
    cta: "Colabora",
  },
];

export const COMMUNITY_FEED: Photo[] = [IMG.yogaBeach, IMG.acai, IMG.running, IMG.meditation, IMG.functional, IMG.smoothie];

export const COMMUNITY_PERKS = ["Contenido de entrenamiento", "Nutrición y recetas", "Retos mensuales", "Meetups y clases", "Beneficios con marcas", "Preventa de eventos"];

/** Formatos de evento de la comunidad (sin fechas: se anuncian en Instagram). */
export const EVENT_FORMATS: { title: string; text: string; photo: Photo }[] = [
  { title: "Sunrise sessions", text: "Yoga, movilidad y respiración al amanecer.", photo: IMG.yogaSunset },
  { title: "Run & train", text: "Salidas a correr y entrenamientos en grupo.", photo: IMG.groupField },
  { title: "Workshops", text: "Nutrición, recovery y mente con especialistas.", photo: IMG.breakfast },
];

export const SHOP = {
  title: "Good Life Apparel",
  text: "Ropa deportiva, básicos y accesorios con la identidad Good Life. Diseñados para entrenar, moverte por la ciudad y llevar el lifestyle contigo.",
  categories: ["Activewear", "Básicos", "Gorras", "Tote bags", "Termos", "Accesorios"],
  photos: [IMG.apparel, IMG.sneakers, IMG.tote] as [Photo, Photo, Photo],
};
