import { IMG, type Photo } from "@/content/images";

/**
 * Contenido oficial del festival (documento de concepto de Good Life Wellness Fest).
 * Fecha, precios, speakers y marcas aún no están definidos: el sitio los muestra
 * como «próximamente» en lugar de inventarlos.
 */
export const FEST = {
  name: "Good Life Wellness Fest",
  tagline: "Vive mejor. Muévete mejor. Siéntete mejor.",
  arrival: "Una nueva experiencia de bienestar llega a Los Mochis.",
  venue: "Lago Ávila",
  city: "Los Mochis, Sinaloa",
  // Ubicación real en Google Maps (Lago Ávila Eventos, 25.8306, -109.0467).
  mapsUrl: "https://maps.app.goo.gl/VRNatKywZ2Pkqot16",
  instagramUrl: "https://www.instagram.com/goodlifewellnessfestlosmochis/",
  instagramHandle: "@goodlifewellnessfestlosmochis",
  // Venta de boletos y registro de cuentas cerrados hasta el lanzamiento.
  ticketsOpen: false,
  // Fecha tentativa: un solo día.
  date: "Domingo 17 de enero de 2027",
  hours: "8:00 a 21:00 h",
  dateLabel: "Domingo 17 de enero de 2027 · 8:00 a 21:00 h",
  startsAt: "2027-01-17T08:00:00-07:00",
  pillarsLine: ["Fitness", "Health", "Nutrition", "Beauty", "Recovery", "Mind", "Lifestyle", "Entertainment"],
  closing: ["Vive la experiencia.", "Descubre tu mejor versión.", "Live the Good Life."],
};

export const INTRO = {
  title: "Una experiencia integral de bienestar",
  body: [
    "Good Life Wellness Fest reúne en un mismo lugar actividad física, salud, nutrición, belleza, recuperación, entretenimiento y estilo de vida.",
    "Un evento creado para personas que buscan mejorar su calidad de vida, descubrir nuevas experiencias, conectar con marcas y profesionales, y disfrutar un día completo dedicado a sentirse y vivir mejor.",
    "No se trata de observar o comprar: aquí vives, pruebas y experimentas cada actividad.",
  ],
};

export const VERBS: { title: string; text: string; photo: Photo }[] = [
  { title: "Te mueves", text: "Clases, entrenamiento y actividades físicas.", photo: IMG.functional },
  { title: "Te nutres", text: "Nutrición, alimentación saludable y productos wellness.", photo: IMG.acai },
  { title: "Te recuperas", text: "Recovery, movilidad, relajación y cuidado corporal.", photo: IMG.massage },
  { title: "Te cuidas", text: "Salud, prevención, belleza y bienestar.", photo: IMG.skincare },
  { title: "Te conectas", text: "Marcas, profesionales, comunidad y nuevas experiencias.", photo: IMG.expo },
  { title: "Te diviertes", text: "Música, dinámicas, retos, activaciones y entretenimiento.", photo: IMG.dancingSunset },
];

export type Pillar = { n: string; slug: string; title: string; lead: string; items: string[]; photos: [Photo, Photo, Photo] };

export const PILLARS: Pillar[] = [
  {
    n: "01",
    slug: "fitness",
    title: "Fitness & Movement",
    lead: "El movimiento como parte fundamental de una vida saludable.",
    items: ["Funcional", "Yoga", "Pilates", "Spinning", "HIIT", "Dance fitness", "Movilidad", "Fuerza", "Entrenamientos especiales", "Retos fitness"],
    photos: [IMG.yogaPark, IMG.spinning, IMG.pilates],
  },
  {
    n: "02",
    slug: "nutrition",
    title: "Nutrition",
    lead: "Un espacio dedicado a la alimentación y la nutrición.",
    items: ["Nutriólogos", "Marcas saludables", "Suplementación", "Bebidas funcionales", "Snacks saludables", "Degustaciones", "Educación nutricional", "Productos wellness"],
    photos: [IMG.bowl, IMG.drinks, IMG.fruits],
  },
  {
    n: "03",
    slug: "health",
    title: "Health",
    lead: "Prevención y cuidado de la salud.",
    items: ["Profesionales de la salud", "Evaluaciones", "Estudios y mediciones", "Charlas", "Prevención", "Salud integral"],
    photos: [IMG.bloodPressure, IMG.running, IMG.doctor],
  },
  {
    n: "04",
    slug: "recovery",
    title: "Recovery",
    lead: "Porque entrenar también significa aprender a recuperarse.",
    items: ["Masajes", "Recovery", "Movilidad", "Fisioterapia", "Terapias", "Stretching", "Recuperación muscular", "Técnicas de relajación"],
    photos: [IMG.massageBack, IMG.physio, IMG.mobility],
  },
  {
    n: "05",
    slug: "beauty",
    title: "Beauty & Self Care",
    lead: "El bienestar también se refleja en cómo nos cuidamos.",
    items: ["Skincare", "Cuidado personal", "Belleza", "Estética", "Productos especializados", "Tratamientos", "Wellness beauty"],
    photos: [IMG.beautyPortrait, IMG.serum, IMG.cream],
  },
  {
    n: "06",
    slug: "mind",
    title: "Mind & Balance",
    lead: "El bienestar no solamente es físico.",
    items: ["Manejo del estrés", "Mindfulness", "Meditación", "Respiración", "Motivación", "Conferencias", "Desarrollo personal"],
    photos: [IMG.meditation, IMG.soundBath, IMG.breathe],
  },
];

export const JOURNEY = [
  "Registro",
  "Welcome experience",
  "Clases",
  "Activaciones",
  "Conferencias",
  "Retos",
  "Shopping",
  "Recovery",
  "Food & wellness",
  "Entretenimiento",
];

export const DAY_BLOCKS: { time: string; title: string; text: string; photo: Photo }[] = [
  { time: "Mañana", title: "Activación y entrenamiento", text: "Arrancamos el día en movimiento: clases y entrenamientos para despertar el cuerpo.", photo: IMG.yogaSunset },
  { time: "Mediodía", title: "Nutrición, wellness y conferencias", text: "Experiencias de nutrición y bienestar, y pláticas en el Good Life Stage.", photo: IMG.bowlMeat },
  { time: "Tarde", title: "Nuevas clases, retos y activaciones", text: "Segunda ronda de clases, retos Good Life y activaciones de marcas.", photo: IMG.battleRopes },
  { time: "Cierre", title: "Experiencia especial", text: "Música, reconocimiento y cierre del festival.", photo: IMG.djSunset },
];

export const ZONES: { name: string; kicker: string; text: string; items: string[]; photo: Photo }[] = [
  {
    name: "Good Life Stage",
    kicker: "Escenario principal",
    text: "Uno de los puntos centrales del evento. Aquí suceden las conversaciones, los lanzamientos y los momentos que todos recordarán.",
    items: ["Conferencias", "Pláticas de especialistas", "Entrevistas", "Presentaciones", "Lanzamientos", "Retos", "Activaciones de patrocinadores", "Reconocimientos", "Experiencias especiales"],
    photo: IMG.stage,
  },
  {
    name: "Good Life Experience Zone",
    kicker: "Prueba y vive",
    text: "Una zona para probar productos y vivir experiencias. Aquí el patrocinador deja de ser solamente un logotipo y se convierte en parte de la experiencia.",
    items: ["Degustaciones", "Demostraciones", "Dinámicas", "Pruebas de producto", "Juegos", "Concursos", "Regalos", "Activaciones"],
    photo: IMG.expo,
  },
  {
    name: "Good Life Market",
    kicker: "Área comercial",
    text: "Marcas que presentan y venden sus productos para tu bienestar.",
    items: ["Fitness", "Ropa deportiva", "Suplementos", "Alimentos", "Bebidas", "Belleza", "Salud", "Tecnología", "Wellness", "Servicios"],
    photo: IMG.apparel,
  },
  {
    name: "Food & Wellness",
    kicker: "Área gastronómica",
    text: "Opciones alineadas al concepto del festival para recargar energía y quedarte más tiempo.",
    items: ["Comida saludable", "Bowls", "Smoothies", "Café", "Bebidas funcionales", "Snacks", "Opciones altas en proteína", "Productos naturales"],
    photo: IMG.acai,
  },
];

export const CHALLENGES = ["Reto funcional", "Reto de fuerza", "Reto de resistencia", "Reto de movilidad", "Reto de pasos", "Reto de hidratación", "Retos de patrocinadores"];
export const CHALLENGE_PRIZES = ["Premios", "Productos", "Experiencias", "Reconocimientos"];

export const WELCOME_KIT = ["Pulsera oficial", "Bolsa Good Life", "Playera oficial", "Toalla", "Productos de patrocinadores", "Muestras", "Cupones", "Beneficios", "Regalos", "Material informativo"];
export const WRISTBAND_USES = ["Acceso", "Identificación", "Control de clases", "Dinámicas", "Activaciones", "Beneficios", "Concursos", "Acceso a experiencias especiales"];

export const AUDIENCE = [
  "Fitness y entrenamiento",
  "Salud y prevención",
  "Nutrición",
  "Pérdida de peso y composición corporal",
  "Running y deporte",
  "Yoga y movilidad",
  "Belleza y cuidado personal",
  "Recuperación física",
  "Salud mental y manejo del estrés",
  "Estilo de vida saludable",
  "Productos naturales y wellness",
  "Nuevas tendencias de bienestar",
];
export const AUDIENCE_PROFILE =
  "Hombres y mujeres de aproximadamente 18 a 50 años: personas activas, profesionales, empresarios, deportistas, familias y consumidores interesados en mejorar su estilo de vida.";

export const PREMIUM = {
  formula: ["Menos personas", "Mayor experiencia", "Mayor valor"],
  benefits: ["Mejor atención", "Mayor comodidad", "Más calidad", "Mejor experiencia", "Mayor interacción con las marcas", "Mayor percepción de exclusividad"],
};

export const DIFFERENT = {
  notOnly: ["una expo", "una competencia", "un festival fitness", "una feria comercial"],
  is: "Es una experiencia integral de bienestar.",
  formula: "Fitness + Health + Nutrition + Beauty + Recovery + Mind + Lifestyle + Entertainment",
};

export const COMMUNITY = {
  title: "Una comunidad, no solo un evento",
  text: "La meta es que Good Life Wellness Fest no termine cuando se apagan las luces: queremos una comunidad conectada durante todo el año.",
  items: ["Contenido", "Entrenamiento", "Nutrición", "Salud", "Eventos", "Experiencias", "Marcas", "Beneficios"],
};

export const VISION = {
  text: "Convertir a Good Life Wellness Fest en un evento referente de bienestar en Sinaloa y, posteriormente, llevar el concepto a otras ciudades.",
  motto: "Una buena vida empieza por cómo decides vivirla.",
};

export const SPONSOR_BENEFITS = [
  "Presencia de marca",
  "Visibilidad durante el evento",
  "Branding",
  "Activaciones",
  "Menciones",
  "Presencia digital",
  "Contenido para redes",
  "Inclusión en materiales promocionales",
  "Experiencias con los participantes",
  "Oportunidad de generar leads",
  "Asociación con un concepto premium de bienestar",
];

export const SPONSOR_EXPERIENCES: { brand: string; idea: string; photo: Photo }[] = [
  { brand: "Marca deportiva", idea: "Reto fitness", photo: IMG.jump },
  { brand: "Bebida", idea: "Estación de hidratación", photo: IMG.hydration },
  { brand: "Gimnasio", idea: "Clase especial", photo: IMG.groupField },
  { brand: "Nutriólogo", idea: "Evaluación o asesoría", photo: IMG.breakfast },
  { brand: "Marca de belleza", idea: "Experiencia de skincare", photo: IMG.skincare },
  { brand: "Marca de recuperación", idea: "Recovery zone", photo: IMG.foamRoller },
  { brand: "Marca de alimentos", idea: "Degustación", photo: IMG.proteinBar },
];

export const PRE_EVENT = ["Save the date", "Presentación de clases", "Revelación de patrocinadores", "Presentación de speakers", "Dinámicas", "Cuenta regresiva", "Lanzamiento de boletos"];

export const OBJECTIVES = [
  { who: "Para el participante", text: "Vivir un día diferente, aprender, entrenar, descubrir marcas y disfrutar experiencias relacionadas con el bienestar." },
  { who: "Para las marcas", text: "Conectar directamente con consumidores potenciales y generar posicionamiento, interacción y ventas." },
  { who: "Para los profesionales", text: "Mostrar conocimiento, servicios y experiencia ante una audiencia interesada." },
  { who: "Para Good Life", text: "Crear una plataforma sólida y replicable que pueda crecer año con año." },
];

export const FAQS = [
  { q: "¿Qué es Good Life Wellness Fest?", a: "Un evento premium de bienestar y estilo de vida que combina clases, conferencias, activaciones, marcas, productos y servicios. No es solo una expo ni una competencia: es una experiencia integral para vivir, probar y experimentar." },
  { q: "¿Dónde será?", a: "En el Lago Ávila, en Los Mochis, Sinaloa." },
  { q: "¿Cuándo es?", a: "Un solo día: el domingo 17 de enero de 2027, de 8:00 a 21:00 h (hora de Los Mochis)." },
  { q: "¿Cómo compro mi entrada?", a: "La venta de boletos se abrirá próximamente. Síguenos en Instagram (@goodlifewellnessfestlosmochis) para enterarte en cuanto esté disponible." },
  { q: "¿A quién va dirigido?", a: "A personas de aproximadamente 18 a 50 años interesadas en fitness, salud, nutrición, running, yoga, belleza, recuperación, salud mental y estilo de vida saludable. Activos, profesionales, empresarios, deportistas y familias." },
  { q: "¿Qué incluye mi entrada?", a: "Podrás recibir un welcome kit con pulsera oficial, bolsa Good Life, playera, toalla, productos y muestras de patrocinadores, cupones y beneficios. Los detalles se darán a conocer con el lanzamiento de boletos." },
  { q: "¿Para qué sirve la pulsera Good Life?", a: "Es tu identificación durante todo el festival: acceso, control de clases, dinámicas, activaciones, beneficios, concursos y acceso a experiencias especiales." },
  { q: "¿Habrá cupo limitado?", a: "Sí. La propuesta es menos personas, mayor experiencia y mayor valor: capacidad controlada para ofrecer mejor atención, comodidad e interacción con las marcas." },
  { q: "¿Puedo tomar más de una clase?", a: "Sí. El programa se organiza por bloques (mañana, mediodía, tarde y cierre) y una misma disciplina podrá tener dos horarios para que más personas la disfruten." },
  { q: "Tengo una marca, ¿cómo participo?", a: "Puedes participar como patrocinador (visibilidad, posicionamiento y beneficios de marca), con un stand en el Good Life Market (espacio comercial) o ambos. Envíanos un mensaje directo (DM) a nuestro Instagram @goodlifewellnessfestlosmochis y te damos toda la información." },
];
