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

  // Selección principal (luz cálida, personas reales en movimiento: guía de fotografía del brandbook)
  pavilionYoga: u("photo-1644612105654-b6b0a941ecde", "Grupo practicando yoga en un pabellón de madera frente al agua", "Unsplash"),
  parkYogaGolden: u("photo-1687436874119-6e587ae3dae5", "Grupo de yoga en un parque con luz dorada", "Unsplash"),
  groupYogaWarm: u("photo-1687875495230-96dfea96d9da", "Grupo sentado en el pasto al atardecer durante una clase", "Unsplash"),
  yogaLawn: u("photo-1758797315487-b3b225dff7d8", "Mujeres practicando yoga en el pasto", "Unsplash"),
  friendsSunset: u("photo-1511632765486-a01980e01a18", "Amigos abrazados viendo el atardecer", "Unsplash"),
  friendsOcean: u("photo-1744943776320-e66046ce4cb4", "Amigos disfrutando el atardecer frente al mar", "Unsplash"),
  laughing: u("photo-1491438590914-bc09fcaaf77a", "Personas riendo y platicando al aire libre", "Unsplash"),
  highFive: u("photo-1770270402445-b72169c6e48a", "Tres mujeres chocando las manos después de entrenar", "Unsplash"),
  womenRun: u("photo-1770269845802-99a69d9a29a9", "Tres amigas corriendo juntas al aire libre", "Unsplash"),
  matsWalk: u("photo-1758274537006-17b0a3acaffb", "Dos mujeres caminando con tapetes de yoga en un parque", "Unsplash"),
  matsWalk2: u("photo-1758274535784-87125dc915cc", "Dos amigas con sus tapetes de yoga en el parque", "Unsplash"),
  runSunrise: u("photo-1758922769578-68c5ba000d87", "Hombre corriendo en la pista al amanecer", "Unsplash"),
  runTrack: u("photo-1744060204728-f68e434a3edf", "Corredor en la pista con luz dorada", "Unsplash"),
  runDuo: u("photo-1513593771513-7b58b6c4af38", "Dos hombres corriendo en el parque al atardecer", "Unsplash"),
  classLeader: u("photo-1772206605293-3fadeaa944e1", "Instructor guiando una clase grupal", "Unsplash"),
  stretchGroup: u("photo-1762769334319-e4b5124d8204", "Grupo estirando antes de salir a correr", "Unsplash"),
  fieldGolden: u("photo-1786025065278-9dd52e4aff48", "Grupo entrenando en el pasto con luz de tarde", "Unsplash"),
  stretchPath: u("photo-1542354771-435b9f200e57", "Mujer estirando en un sendero", "Unsplash"),
  reformer: u("photo-1747238415033-b74eec07eb59", "Mujer haciendo pilates en reformer con luz natural", "Unsplash"),
  yogaWindow: u("photo-1697060739671-586c21fa5e30", "Mujer en postura de yoga frente a un ventanal", "Unsplash"),
  sunWoman: u("photo-1461468611824-46457c0e11fd", "Mujer de frente al sol al amanecer", "Unsplash"),
  benchSunset: u("photo-1522075782449-e45a34f1ddfb", "Mujer sentada contemplando el atardecer", "Unsplash"),
  meditateField: u("photo-1571935538821-8ecb6b4dea17", "Mujer meditando sentada en el campo", "Unsplash"),
  granola: u("photo-1760533535534-c69f637df2e6", "Granola con yogur y fruta fresca", "Unsplash"),
  smoothieBowl: u("photo-1757592797141-d41e1bfe6b0e", "Smoothie bowl con fruta y granola", "Unsplash"),
  breakfastPool: u("photo-1760533536165-ddaf3c79b814", "Desayuno saludable junto a la alberca", "Unsplash"),
  morningMug: u("photo-1789540883496-4a5b0f9d2900", "Mujer tomando café junto a una ventana soleada", "Unsplash"),
  apparelWoman: u("photo-1621931678092-3673b7d295be", "Mujer con top deportivo en tono tierra", "Unsplash"),
  tees: u("photo-1716951988375-37d5793385d0", "Playeras dobladas en tonos neutros", "Unsplash"),
  capGreen: u("photo-1720534490358-bc2ad29d51d5", "Gorra sobre una silla de madera", "Unsplash"),
  hoodie: u("photo-1691132615844-b013a05b51e7", "Mujer con sudadera en tono arena", "Unsplash"),
  massageWarm: u("photo-1741522509438-a120c0bb5e88", "Masaje de espalda con luz cálida", "Unsplash"),
  massageHerbal: u("photo-1775133262667-316bd4d9e5b5", "Masaje con bolsas de hierbas", "Unsplash"),
  gymHighFive: u("photo-1785861632239-3945f4e5a28c", "Grupo chocando las manos en el gimnasio", "Unsplash"),
  kettlebell: u("photo-1758875570127-b6ff35e42436", "Pareja entrenando con kettlebells", "Unsplash"),
  sleds: u("photo-1780398522435-1383c1a173b1", "Dos hombres entrenando con trineos", "Unsplash"),
  crowdEvent: u("photo-1782567530651-5e875fec7c62", "Público reunido en un evento al aire libre", "Unsplash"),
  festivalGolden: u("photo-1784123476726-9e216651b198", "Asistentes a un festival al atardecer", "Unsplash"),
  festivalCanopy: u("photo-1785404565756-1ac780594785", "Picnic bajo una carpa en un festival", "Unsplash"),
  lawnTalk: u("photo-1610070835951-156b6921281d", "Grupo sentado en el pasto escuchando una charla", "Unsplash"),
  beachYogaSunset: u("photo-1760774714285-61ff516f86c5", "Yoga en la playa al atardecer", "Unsplash"),

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
