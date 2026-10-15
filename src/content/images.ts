/**
 * Fotografías del sitio.
 *  - `local`: fotos reales del Lago Ávila (carpeta /public/images).
 *  - `unsplash`: fotos de referencia con licencia Unsplash (uso libre). Sustitúyelas por
 *    fotografía propia del festival cuando exista.
 */
export type Photo = { src: string; alt: string; credit?: string; kind: "local" | "unsplash" };

const u = (id: string, alt: string, credit: string): Photo => ({ src: `https://images.unsplash.com/${id}`, alt, credit, kind: "unsplash" });
const l = (file: string, alt: string): Photo => ({ src: `/images/${file}`, alt, kind: "local" });

export const IMG = {
  // Sede (fotos reales)
  lakeHero: l("lago-5.jpg", "Pabellón de cristal, palapa y muelles de madera del Lago Ávila al atardecer"),
  lakeSunset: l("lago-4.jpg", "Puente de madera sobre el Lago Ávila al atardecer"),
  lakeAerial: l("lago-2.jpg", "Vista aérea del recinto junto al lago"),
  lakeNight: l("lago-noche.jpg", "El recinto iluminado al anochecer"),
  lakeEntrance: l("lago-3.jpg", "Entrada del recinto iluminada"),
  lakeLogo: l("hero-logo-lago.jpg", "Logotipo de Good Life Wellness Fest sobre el lago"),

  // Charlas y market
  stage: l("charlas-1.jpg", "Charla de bienestar al aire libre frente al público"),
  talk: l("charlas-2.jpg", "Panel de bienestar en el escenario con público"),
  market: l("wellness-market.jpg", "Perchero con ropa deportiva en el wellness market"),

  // Fitness & movement
  yogaPark: u("photo-1687436874774-fa0d4616bec9", "Grupo practicando yoga al aire libre", "Marea Wellness"),
  yogaBeach: u("photo-1545205597-3d9d02c29597", "Cinco mujeres practicando yoga frente al mar", "Kaylee Garrett"),
  yogaSunset: u("photo-1543858828-7cf1a9beb95c", "Personas con los brazos en alto frente al mar", "Unsplash"),
  functional: u("photo-1554284126-aa88f22d8b74", "Tres personas entrenando fuerza con barras", "Sven Mieke"),
  pilates: u("photo-1747239685045-fcbcf98985db", "Mujer haciendo pilates en reformer", "Roxana Popovici"),
  spinning: u("photo-1709315821780-3c092a9eddda", "Clase grupal de spinning", "Redd Francisco"),
  hiit: u("photo-1649789248266-ef1c7f744f6f", "Pareja haciendo lagartijas con mancuernas", "Unsplash"),
  dance: u("photo-1524594152303-9fd13543fe6e", "Mujeres en clase de baile", "Danielle Cerullo"),
  mobility: u("photo-1621691211095-fe4b38f21788", "Mujer estirando en postura de yoga", "Chalo Garcia"),
  battleRopes: u("photo-1669322779651-5ca89652492e", "Hombre entrenando con cuerdas de batalla", "Unsplash"),
  jump: u("photo-1627483298235-f3bac2567c1c", "Mujer saltando durante un entrenamiento", "Unsplash"),
  running: u("photo-1552674605-db6ffd4facb5", "Tres mujeres corriendo", "Fitsum Admasu"),
  groupField: u("photo-1786025065736-c57c95cd4369", "Grupo entrenando en el pasto", "Unsplash"),
  boxing: u("photo-1517438322307-e67111335449", "Dos personas practicando boxeo", "Unsplash"),

  // Nutrition
  bowl: u("photo-1512621776951-a57141f2eefd", "Bowl de vegetales frescos", "Anna Pelzer"),
  bowlMeat: u("photo-1546069901-ba9599a7e63c", "Bowl saludable con proteína y vegetales", "Anh Nguyen"),
  acai: u("photo-1627308594190-a057cd4bfac8", "Dos bowls de açaí con fruta y granola", "Unsplash"),
  drinks: u("photo-1662130187270-a4d52c700eb6", "Bebidas funcionales de colores", "Fanny Gustafsson"),
  smoothie: u("photo-1615478503562-ec2d8aa0e24e", "Smoothie de frutos rojos", "Sara Julie"),
  fruits: u("photo-1490818387583-1baba5e638af", "Variedad de fruta fresca", "Brooke Lark"),
  breakfast: u("photo-1490645935967-10de6ba17061", "Plato saludable con huevo y vegetales", "Brooke Lark"),
  proteinBar: u("photo-1742860866012-fc167d8366bf", "Barra de proteína sobre madera", "Macourt Media"),
  coffee: u("photo-1485808191679-5f86510681a2", "Café latte", "Jeremy Yap"),
  hydration: u("photo-1600679472233-eabc13b79f07", "Hombre hidratándose después de entrenar", "Unsplash"),

  // Health
  bloodPressure: u("photo-1615486511484-92e172cc4fe0", "Medición de presión arterial", "Unsplash"),
  doctor: u("photo-1631815587646-b85a1bb027e1", "Profesional de la salud tomando la presión", "Unsplash"),

  // Recovery
  massage: u("photo-1519823551278-64ac92734fb1", "Masaje terapéutico", "Toa Heftiba"),
  massageBack: u("photo-1745327883508-b6cd32e5dde5", "Terapeuta dando masaje de espalda", "Jakub Klucký"),
  physio: u("photo-1645005512968-0c1fe99f0093", "Fisioterapia de hombro", "Sincerely Media"),
  foamRoller: u("photo-1738524108491-9a0db4067897", "Grupo haciendo ejercicios de movilidad", "Unsplash"),

  // Beauty & self care
  skincare: u("photo-1581182800629-7d90925ad072", "Rutina de cuidado de la piel", "Fleur Kaan"),
  serum: u("photo-1573461160327-b450ce3d8e7f", "Gotero de sérum", "Enecta"),
  cream: u("photo-1585945037805-5fd82c2e60b1", "Textura de crema", "Kelsey Curtis"),
  beautyPortrait: u("photo-1555820585-c5ae44394b79", "Retrato sereno con ojos cerrados", "Sunny Ng"),

  // Mind & balance
  meditation: u("photo-1602192509154-0b900ee1f851", "Mujer meditando en el pasto", "Benjamin Child"),
  breathe: u("photo-1507120410856-1f35574c3b45", "Letrero de neón con la palabra breathe", "Fabian Møller"),
  soundBath: u("photo-1593810451410-8fbb422cc15e", "Cuenco tibetano en sesión de sonido", "Unsplash"),
  handsUp: u("photo-1608405059861-b21a68ae76a2", "Grupo con los brazos en alto", "Amau Mexia"),

  // Stage, marcas, entretenimiento
  expo: u("photo-1761195689615-9469b65dac01", "Personas interactuando en un stand", "Unsplash"),
  convention: u("photo-1785123463585-1ba21ff9ff57", "Personas recorriendo una exposición", "Unsplash"),
  experienceHall: u("photo-1785123379992-5102aee2c088", "Personas recorriendo un salón de exposiciones con stands", "Aaron Douglas"),
  apparel: u("photo-1763771522867-c26bf75f12bc", "Exhibición de ropa deportiva", "Unsplash"),
  sneakers: u("photo-1760302318631-a8d342cd4951", "Tenis deportivos en exhibición", "Unsplash"),
  crowd: u("photo-1533174072545-7a4b6ad7a6c3", "Personas reunidas en un festival al aire libre", "Danny Howe"),
  concert: u("photo-1501386761578-eac5c94b800a", "Público celebrando en un evento", "Nicholas Green"),
  djSunset: u("photo-1778812268889-79d82e05216f", "Equipo de DJ frente a un atardecer", "Unsplash"),
  dancingSunset: u("photo-1495837174058-628aafc7d610", "Siluetas bailando al atardecer", "Unsplash"),
  tote: u("photo-1574365569389-a10d488ca3fb", "Bolsa reutilizable", "Brando Makes Branding"),
} satisfies Record<string, Photo>;
