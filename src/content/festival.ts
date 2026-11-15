import { IMG, type Photo } from "@/content/images";

/**
 * Contenido oficial del festival (documento de concepto de Good Life Wellness Fest).
 * Fecha, precios, speakers y marcas aún no están definidos: el sitio los muestra
 * como «próximamente» en lugar de inventarlos.
 */
export const FEST = {
  name: "Good Life Wellness Fest",
  tagline: "Vive mejor. Muévete mejor. Siéntete mejor.",
  arrival: "Un día completo de bienestar frente al Lago Ávila.",
  venue: "Lago Ávila",
  city: "Los Mochis, Sinaloa",
  // Ubicación real en Google Maps (Lago Ávila Eventos, 25.8306, -109.0467).
  mapsUrl: "https://maps.app.goo.gl/VRNatKywZ2Pkqot16",
  instagramUrl: "https://www.instagram.com/goodlifewellnesslm/",
  instagramHandle: "@goodlifewellnesslm",
  // Las entradas se venden SOLO en puntos físicos o por mensaje (WhatsApp / DM).
  // El personal registra a cada persona y le llega un correo para activar su cuenta.
  // salesOpen: muestra los puntos de venta y el contacto en /festival/entradas.
  salesOpen: false,
  // Compra en línea (/comprar) y registro libre (/registro): desactivados; el código
  // se conserva por si algún día se reactivan.
  onlineSales: false,
  selfSignup: false,
  // Fecha tentativa: un solo día.
  date: "Domingo 24 de enero de 2027",
  hours: "6:30 a 18:00 h",
  dateLabel: "Domingo 24 de enero de 2027 · 6:30 a 18:00 h",
  startsAt: "2027-01-24T06:30:00-07:00",
  pillarsLine: ["Fitness", "Health", "Nutrition", "Beauty", "Recovery", "Mind", "Lifestyle", "Entertainment"],
  closing: ["Vive la experiencia.", "Descubre tu mejor versión.", "Live the Good Life."],
};

/** Menú del sitio del festival (todas sus páginas viven bajo /festival). */
export const FESTIVAL_NAV = [
  { href: "/festival/experiencias", label: "La experiencia" },
  { href: "/festival/programa", label: "Programa" },
  { href: "/festival/conferencias", label: "Good Life Stage" },
  { href: "/festival/expositores", label: "Marcas" },
  { href: "/festival/faq", label: "Preguntas" },
];

export const INTRO = {
  title: "Un día para moverte, probar cosas nuevas y pasarla bien.",
  body: [
    "Good Life Wellness Fest es el festival de Good Life Wellness. Un domingo entero con clases, charlas, comida saludable, marcas y música en el Lago Ávila.",
    "Aquí no vienes a ver desde lejos: entras a las clases, pruebas productos, platicas con especialistas y te llevas ideas para tu día a día.",
  ],
};

/** Datos clave del festival. */
export const FACTS = [
  { label: "Fecha", value: "24 ene 2027", note: "Domingo" },
  { label: "Horario", value: "6:30 – 18:00", note: "Hora de Los Mochis" },
  { label: "Lugar", value: "Lago Ávila", note: "Los Mochis, Sinaloa" },
  { label: "Cupo", value: "Limitado", note: "Para que todo se disfrute mejor" },
];

export const VERBS: { title: string; text: string; photo: Photo }[] = [
  { title: "Te mueves", text: "Clases, entrenamiento y actividades físicas.", photo: IMG.fieldGolden },
  { title: "Te nutres", text: "Nutrición, alimentación saludable y productos wellness.", photo: IMG.smoothieBowl },
  { title: "Te recuperas", text: "Recovery, movilidad, relajación y cuidado corporal.", photo: IMG.massageWarm },
  { title: "Te cuidas", text: "Salud, prevención, belleza y bienestar.", photo: IMG.skincare },
  { title: "Te conectas", text: "Marcas, profesionales, comunidad y nuevas experiencias.", photo: IMG.talk },
  { title: "Te diviertes", text: "Música, dinámicas, retos, activaciones y entretenimiento.", photo: IMG.friendsOcean },
];

export type Pillar = { n: string; slug: string; title: string; lead: string; items: string[]; photos: [Photo, Photo, Photo] };

export const PILLARS: Pillar[] = [
  {
    n: "01",
    slug: "fitness",
    title: "Fitness & Movement",
    lead: "Clases para todos los niveles, de yoga a Hyrox.",
    items: ["Hyrox principiantes", "Hyrox avanzados", "Yoga", "Meditación", "Movilidad", "Funcional fitness", "CrossFit", "Y más por anunciar"],
    photos: [IMG.parkYogaGolden, IMG.kettlebell, IMG.sleds],
  },
  {
    n: "02",
    slug: "nutrition",
    title: "Nutrition",
    lead: "Comida, bebidas y asesoría para comer mejor sin complicarte.",
    items: ["Nutriólogos", "Marcas saludables", "Suplementación", "Bebidas funcionales", "Snacks saludables", "Degustaciones", "Educación nutricional", "Productos wellness"],
    photos: [IMG.smoothieBowl, IMG.granola, IMG.breakfastPool],
  },
  {
    n: "03",
    slug: "health",
    title: "Health",
    lead: "Chequeos y charlas con profesionales de la salud.",
    items: ["Profesionales de la salud", "Evaluaciones", "Estudios y mediciones", "Charlas", "Prevención", "Salud integral"],
    photos: [IMG.runSunrise, IMG.bloodPressure, IMG.doctor],
  },
  {
    n: "04",
    slug: "recovery",
    title: "Recovery",
    lead: "Entrenar también es saber descansar.",
    items: ["Masajes", "Recovery", "Movilidad", "Fisioterapia", "Terapias", "Stretching", "Recuperación muscular", "Técnicas de relajación"],
    photos: [IMG.massageWarm, IMG.massageHerbal, IMG.stretchPath],
  },
  {
    n: "05",
    slug: "beauty",
    title: "Beauty & Self Care",
    lead: "Cuidado personal para sentirte bien por dentro y por fuera.",
    items: ["Skincare", "Cuidado personal", "Belleza", "Estética", "Productos especializados", "Tratamientos", "Wellness beauty"],
    photos: [IMG.beautyPortrait, IMG.serum, IMG.cream],
  },
  {
    n: "06",
    slug: "mind",
    title: "Mind & Balance",
    lead: "Respirar, bajar el ritmo y aclarar la mente.",
    items: ["Manejo del estrés", "Mindfulness", "Meditación", "Respiración", "Motivación", "Conferencias", "Desarrollo personal"],
    photos: [IMG.meditateField, IMG.benchSunset, IMG.sunWoman],
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
  { time: "Mañana", title: "Despierta el cuerpo", text: "Arrancamos temprano con clases y entrenamientos al aire libre.", photo: IMG.parkYogaGolden },
  { time: "Mediodía", title: "Come, escucha y aprende", text: "Charlas en el Good Life Stage, comida saludable y tiempo para recorrer las marcas.", photo: IMG.lawnTalk },
  { time: "Tarde", title: "Segunda ronda", text: "Más clases, retos Good Life y actividades con las marcas.", photo: IMG.kettlebell },
  { time: "Cierre", title: "Cerramos con el atardecer", text: "Música, premiación de retos y el cierre frente al lago.", photo: IMG.festivalGolden },
];

export const ZONES: { name: string; kicker: string; text: string; items: string[]; photo: Photo }[] = [
  {
    name: "Good Life Stage",
    kicker: "Escenario principal",
    text: "El escenario principal. Aquí pasan las charlas, las entrevistas y los momentos más importantes del día.",
    items: ["Conferencias", "Pláticas de especialistas", "Entrevistas", "Presentaciones", "Lanzamientos", "Retos", "Activaciones de patrocinadores", "Experiencias especiales"],
    photo: IMG.stage,
  },
  {
    name: "Good Life Experience Zone",
    kicker: "Prueba y vive",
    text: "Las marcas no solo ponen su logo: aquí pruebas sus productos, participas en dinámicas y te llevas regalos.",
    items: ["Degustaciones", "Demostraciones", "Dinámicas", "Pruebas de producto", "Juegos", "Concursos", "Regalos", "Activaciones"],
    photo: IMG.experienceHall,
  },
  {
    name: "Good Life Market",
    kicker: "Área comercial",
    text: "Ropa deportiva, suplementos, belleza y más, para seguir cuidándote después del festival.",
    items: ["Fitness", "Ropa deportiva", "Suplementos", "Alimentos", "Bebidas", "Belleza", "Salud", "Tecnología", "Wellness", "Servicios"],
    photo: IMG.market,
  },
  {
    name: "Food & Wellness",
    kicker: "Área gastronómica",
    text: "Comida rica y saludable para recargar energía y quedarte todo el día.",
    items: ["Comida saludable", "Bowls", "Smoothies", "Café", "Bebidas funcionales", "Snacks", "Opciones altas en proteína", "Productos naturales"],
    photo: IMG.breakfastPool,
  },
];

export const CHALLENGES = ["Reto funcional", "Reto de fuerza", "Reto de resistencia", "Reto de movilidad"];
export const CHALLENGE_PRIZES = ["Premios", "Productos", "Experiencias", "Reconocimientos"];

/**
 * Dónde y cómo se compran las entradas (se muestra en /festival/entradas cuando FEST.salesOpen).
 * Completa los puntos de venta y el número de WhatsApp antes de abrir la venta.
 */
export const TICKET_SALES: {
  /** Número de WhatsApp con lada, solo dígitos (p. ej. "526681234567"). Vacío = no se muestra. */
  whatsapp: string;
  points: { name: string; address: string; hours?: string; mapsUrl?: string }[];
} = {
  whatsapp: "",
  points: [],
};

export const HOW_TO_BUY: { title: string; text: string }[] = [
  { title: "Compra tu entrada", text: "En un punto de venta físico o por mensaje (WhatsApp o DM en Instagram)." },
  { title: "Te registramos", text: "Capturamos tu nombre, correo, teléfono y edad. Si compras por mensaje, recoges tu pulsera antes del festival o en la entrada." },
  { title: "Activa tu cuenta", text: "Te llega un correo: crea tu contraseña y entra a tu portal: ahí está tu boleto virtual y reservas tus clases." },
  { title: "Aparta tus clases", text: "Reserva tu lugar en clases y actividades y activa los avisos para no perderte nada." },
];

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
  "Para quien quiere cuidarse, desde quien apenas empieza hasta quien entrena todos los días. Pensado para adultos de 18 a 50 años, más o menos, y para venir con amigos o en familia.";

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
  { brand: "Marca deportiva", idea: "Reto fitness", photo: IMG.sleds },
  { brand: "Bebida", idea: "Estación de hidratación", photo: IMG.hydration },
  { brand: "Gimnasio", idea: "Clase especial", photo: IMG.classLeader },
  { brand: "Nutriólogo", idea: "Evaluación o asesoría", photo: IMG.breakfastPool },
  { brand: "Marca de belleza", idea: "Experiencia de skincare", photo: IMG.skincare },
  { brand: "Marca de recuperación", idea: "Zona de recovery", photo: IMG.massageHerbal },
  { brand: "Marca de alimentos", idea: "Degustación", photo: IMG.granola },
];

export const PRE_EVENT = ["Save the date", "Presentación de clases", "Revelación de patrocinadores", "Presentación de speakers", "Dinámicas", "Cuenta regresiva", "Lanzamiento de boletos"];

export const OBJECTIVES = [
  { who: "Para el participante", text: "Vivir un día diferente, aprender, entrenar, descubrir marcas y disfrutar experiencias relacionadas con el bienestar." },
  { who: "Para las marcas", text: "Conectar directamente con consumidores potenciales y generar posicionamiento, interacción y ventas." },
  { who: "Para los profesionales", text: "Mostrar conocimiento, servicios y experiencia ante una audiencia interesada." },
  { who: "Para Good Life", text: "Crear una plataforma sólida y replicable que pueda crecer año con año." },
];

export const FAQS = [
  { q: "¿Qué es Good Life Wellness Fest?", a: "Es el festival de Good Life Wellness: un día con clases, charlas, comida saludable, marcas y música en el Lago Ávila. La idea es que participes, no solo que mires." },
  { q: "¿Dónde será?", a: "En el Lago Ávila, en Los Mochis, Sinaloa." },
  { q: "¿Cuándo es?", a: "Un solo día: el domingo 24 de enero de 2027, de 6:30 a 18:00 h (hora de Los Mochis)." },
  { q: "¿Cómo compro mi entrada?", a: "En nuestros puntos de venta o por mensaje (WhatsApp o DM en Instagram a @goodlifewellnesslm). Al comprar te pedimos nombre, correo, teléfono y edad. Después te llega un correo para crear tu contraseña y entrar a tu cuenta." },
  { q: "¿Cómo aparto mi lugar en las clases?", a: "Con tu cuenta activada entra a «Mi cuenta» → «Reservar». Los cupos son limitados; si activas las notificaciones te avisaremos antes de cada clase que apartes." },
  { q: "¿A quién va dirigido?", a: "A cualquier persona que quiera cuidarse, desde quien apenas empieza hasta quien entrena diario. Está pensado para adultos de 18 a 50 años, más o menos, y para venir con amigos o en familia." },
  { q: "¿Qué incluye mi entrada?", a: "Acceso al festival con tu pulsera oficial Good Life y la reserva de clases y actividades desde tu portal. Los detalles se darán a conocer con el lanzamiento de boletos." },
  { q: "¿Para qué sirve la pulsera Good Life?", a: "Es tu identificación durante todo el festival: acceso, control de clases, dinámicas, activaciones, beneficios, concursos y acceso a experiencias especiales." },
  { q: "¿Habrá cupo limitado?", a: "Sí. Preferimos menos gente y que todos la pasen bien: más espacio en las clases, mejor atención y más tiempo con las marcas." },
  { q: "¿Puedo tomar más de una clase?", a: "Sí. El programa se organiza por bloques (mañana, mediodía, tarde y cierre) y una misma disciplina podrá tener dos horarios para que más personas la disfruten." },
  { q: "Tengo una marca, ¿cómo participo?", a: "Puedes ser patrocinador, poner un stand en el Good Life Market o ambas cosas. Mándanos un DM a @goodlifewellnesslm y te pasamos toda la información." },
];
