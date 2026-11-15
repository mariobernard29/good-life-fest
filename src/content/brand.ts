import { IMG, type Photo } from "@/content/images";

/**
 * Good Life Wellness: la marca. Comunidad en redes, eventos, ropa y accesorios.
 * Good Life Wellness Fest es su evento principal (ver content/festival.ts).
 * Tono (brandbook): cercano, de tú, frases cortas, sin tecnicismos ni promesas médicas.
 */
export const BRAND = {
  name: "Good Life Wellness",
  tagline: "Live the Good Life.",
  city: "Los Mochis, Sinaloa",
  instagramUrl: "https://www.instagram.com/goodlifewellnesslm/",
  instagramHandle: "@goodlifewellnesslm",
};

export const BRAND_NAV = [
  { href: "/#que-es", label: "Qué es" },
  { href: "/#comunidad", label: "Comunidad" },
  { href: "/#eventos", label: "Eventos" },
  { href: "/#shop", label: "Shop" },
  { href: "/festival", label: "Wellness Fest" },
];

export const HERO = {
  title: "Sentirte bien es mejor en compañía.",
  text: "Somos Good Life Wellness, una comunidad de bienestar en Los Mochis. Entrenamos juntos, organizamos eventos y compartimos lo que nos ayuda a vivir mejor.",
};

/** La definición de la marca, sin rodeos. */
export const ABOUT = {
  title: "Una comunidad para moverte, comer mejor y convivir.",
  body: [
    "Good Life Wellness nació en Los Mochis con una idea sencilla: cuidarte es más fácil cuando no lo haces solo.",
    "Por eso juntamos a personas que quieren sentirse mejor, sin importar si apenas empiezan o si ya entrenan todos los días. Nos vemos en clases, carreras, talleres y en nuestro festival. Y entre evento y evento, seguimos en contacto por Instagram.",
  ],
};

/** Lo que hace la marca, en cuatro partes. */
export const PILLARS: { n: string; title: string; text: string; href: string; photo: Photo }[] = [
  { n: "01", title: "Comunidad", text: "Rutinas, recetas, retos y avisos de cada evento. Todo empieza en nuestro Instagram.", href: "/#comunidad", photo: IMG.highFive },
  { n: "02", title: "Eventos", text: "Clases al aire libre, salidas a correr, talleres y el Good Life Wellness Fest.", href: "/#eventos", photo: IMG.pavilionYoga },
  { n: "03", title: "Ropa y accesorios", text: "Prendas cómodas para entrenar y para tu día a día. Muy pronto.", href: "/#shop", photo: IMG.apparelWoman },
  { n: "04", title: "Alianzas", text: "Trabajamos con marcas, gimnasios y especialistas de la región.", href: "/#alianzas", photo: IMG.classLeader },
];

/** Valores (frases cortas, sin promesas). */
export const VALUES = [
  { title: "A tu ritmo", text: "No hace falta ser atleta. Vienes como estás y avanzas a tu paso." },
  { title: "En compañía", text: "Entrenar con más gente motiva, y de ahí salen buenas amistades." },
  { title: "Al aire libre", text: "Aprovechamos el clima y los espacios de la ciudad: parques, el lago, la playa." },
];

export const COMMUNITY = {
  title: "La comunidad vive en Instagram.",
  text: "Ahí publicamos rutinas, recetas, retos y las fechas de cada evento. Si quieres ser de los primeros en enterarte, síguenos.",
  feed: [IMG.yogaLawn, IMG.smoothieBowl, IMG.womenRun, IMG.sunWoman, IMG.matsWalk, IMG.granola] as Photo[],
  perks: ["Rutinas y tips de entrenamiento", "Recetas fáciles y saludables", "Retos mensuales", "Fechas de clases y eventos", "Descuentos con marcas aliadas", "Preventa del festival"],
};

/** Tipos de evento de la comunidad (sin fechas: se anuncian en Instagram). */
export const EVENT_FORMATS: { title: string; text: string; photo: Photo }[] = [
  { title: "Clases al amanecer", text: "Yoga, movilidad y respiración para empezar el día.", photo: IMG.parkYogaGolden },
  { title: "Salidas a correr", text: "Grupos para todos los niveles. Corremos, estiramos y desayunamos.", photo: IMG.stretchGroup },
  { title: "Talleres", text: "Nutrición, descanso y salud con especialistas locales.", photo: IMG.morningMug },
];

export const SHOP = {
  title: "Good Life Apparel",
  text: "Estamos preparando nuestra primera colección: ropa para entrenar, básicos y accesorios con la identidad Good Life. Cómoda, de buena calidad y en los colores de la marca.",
  categories: ["Ropa deportiva", "Playeras y sudaderas", "Tote bags", "Termos", "Accesorios"],
  photos: [IMG.hoodie, IMG.tees, IMG.tote] as [Photo, Photo, Photo],
};

export const PARTNERS = {
  title: "¿Tienes una marca o un negocio de bienestar?",
  text: "Hacemos colaboraciones de contenido, activaciones en eventos y patrocinios. Escríbenos por mensaje directo y platicamos.",
};
