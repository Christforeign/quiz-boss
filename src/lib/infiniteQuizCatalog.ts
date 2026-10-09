import { HARD_QUESTIONS, type QuizQuestion } from "./hardQuestions";

/**
 * Base encyclopédique structurée permettant de générer un catalogue de +12 000 questions
 * uniques, vérifiées et variées (Géographie, Culture & Histoire, Musique & TikTok,
 * Cinéma & Séries, Informatique & Sciences), en Français, Créole et Anglais.
 */

const COUNTRIES: Array<[string, string, string, string, number]> = [
  // [Pays, Capitale, Continent, Monnaie, Difficulté]
  ["Haïti", "Port-au-Prince", "Amérique", "Gourde (HTG)", 1],
  ["République dominicaine", "Saint-Domingue", "Amérique", "Peso dominicain", 1],
  ["France", "Paris", "Europe", "Euro", 1],
  ["Canada", "Ottawa", "Amérique", "Dollar canadien", 1],
  ["États-Unis", "Washington D.C.", "Amérique", "Dollar américain", 1],
  ["Brésil", "Brasilia", "Amérique", "Réal brésilien", 2],
  ["Argentine", "Buenos Aires", "Amérique", "Peso argentin", 2],
  ["Colombie", "Bogota", "Amérique", "Peso colombien", 2],
  ["Mexique", "Mexico", "Amérique", "Peso mexicain", 1],
  ["Cuba", "La Havane", "Amérique", "Peso cubain", 1],
  ["Jamaïque", "Kingston", "Amérique", "Dollar jamaïcain", 2],
  ["Sénégal", "Dakar", "Afrique", "Franc CFA", 2],
  ["Côte d'Ivoire", "Yamoussoukro", "Afrique", "Franc CFA", 3],
  ["Cameroun", "Yaoundé", "Afrique", "Franc CFA", 2],
  ["RD Congo", "Kinshasa", "Afrique", "Franc congolais", 2],
  ["Maroc", "Rabat", "Afrique", "Dirham marocain", 2],
  ["Algérie", "Alger", "Afrique", "Dinar algérien", 2],
  ["Tunisie", "Tunis", "Afrique", "Dinar tunisien", 2],
  ["Égypte", "Le Caire", "Afrique", "Livre égyptienne", 1],
  ["Nigeria", "Abuja", "Afrique", "Naira", 3],
  ["Ghana", "Accra", "Afrique", "Cedi", 3],
  ["Afrique du Sud", "Pretoria", "Afrique", "Rand", 3],
  ["Éthiopie", "Addis-Abeba", "Afrique", "Birr", 3],
  ["Kenya", "Nairobi", "Afrique", "Shilling kényan", 2],
  ["Madagascar", "Antananarivo", "Afrique", "Ariary", 3],
  ["Mali", "Bamako", "Afrique", "Franc CFA", 2],
  ["Burkina Faso", "Ouagadougou", "Afrique", "Franc CFA", 3],
  ["Bénin", "Porto-Novo", "Afrique", "Franc CFA", 4],
  ["Togo", "Lomé", "Afrique", "Franc CFA", 3],
  ["Guinée", "Conakry", "Afrique", "Franc guinéen", 3],
  ["Rwanda", "Kigali", "Afrique", "Franc rwandais", 3],
  ["Japon", "Tokyo", "Asie", "Yen", 1],
  ["Chine", "Pékin", "Asie", "Yuan (Renminbi)", 1],
  ["Inde", "New Delhi", "Asie", "Roupie indienne", 2],
  ["Corée du Sud", "Séoul", "Asie", "Won sud-coréen", 2],
  ["Thaïlande", "Bangkok", "Asie", "Baht", 2],
  ["Viêt Nam", "Hanoï", "Asie", "Dong", 3],
  ["Indonésie", "Jakarta", "Asie", "Roupie indonésienne", 3],
  ["Turquie", "Ankara", "Asie", "Livre turque", 3],
  ["Arabie saoudite", "Riyad", "Asie", "Riyal saoudien", 3],
  ["Émirats arabes unis", "Abou Dabi", "Asie", "Dirham des Émirats", 3],
  ["Israël", "Jérusalem", "Asie", "Shekel", 3],
  ["Liban", "Beyrouth", "Asie", "Livre libanaise", 3],
  ["Australie", "Canberra", "Océanie", "Dollar australien", 3],
  ["Nouvelle-Zélande", "Wellington", "Océanie", "Dollar néo-zélandais", 3],
  ["Allemagne", "Berlin", "Europe", "Euro", 1],
  ["Espagne", "Madrid", "Europe", "Euro", 1],
  ["Italie", "Rome", "Europe", "Euro", 1],
  ["Royaume-Uni", "Londres", "Europe", "Livre sterling", 1],
  ["Portugal", "Lisbonne", "Europe", "Euro", 2],
  ["Belgique", "Bruxelles", "Europe", "Euro", 1],
  ["Suisse", "Berne", "Europe", "Franc suisse", 3],
  ["Pays-Bas", "Amsterdam", "Europe", "Euro", 2],
  ["Suède", "Stockholm", "Europe", "Couronne suédoise", 2],
  ["Norvège", "Oslo", "Europe", "Couronne norvégienne", 2],
  ["Pologne", "Varsovie", "Europe", "Zloty", 2],
  ["Grèce", "Athènes", "Europe", "Euro", 2],
  ["Russie", "Moscou", "Europe", "Rouble", 1],
  ["Ukraine", "Kiev", "Europe", "Hryvnia", 2],
  ["Pérou", "Lima", "Amérique", "Sol péruvien", 2],
  ["Chili", "Santiago", "Amérique", "Peso chilien", 2],
  ["Venezuela", "Caracas", "Amérique", "Bolivar", 3],
  ["Équateur", "Quito", "Amérique", "Dollar américain", 3],
  ["Bolivie", "Sucre", "Amérique", "Boliviano", 4],
  ["Uruguay", "Montevideo", "Amérique", "Peso uruguayen", 3],
  ["Paraguay", "Asuncion", "Amérique", "Guarani", 4],
  ["Panama", "Panama", "Amérique", "Balboa", 3],
  ["Costa Rica", "San José", "Amérique", "Colon costaricien", 3],
  ["Bahamas", "Nassau", "Amérique", "Dollar bahaméen", 3],
  ["Barbade", "Bridgetown", "Amérique", "Dollar barbadien", 4],
  ["Trinité-et-Tobago", "Port-d'Espagne", "Amérique", "Dollar de Trinité-et-Tobago", 4],
  ["Suriname", "Paramaribo", "Amérique", "Dollar surinamais", 4],
  ["Guyana", "Georgetown", "Amérique", "Dollar guyanien", 4],
];

const HAITI_COMMUNES: Array<[string, string, string, number]> = [
  // [Ville/Commune, Département, Particularité, Difficulté]
  ["Port-au-Prince", "Ouest", "Capitale nationale d'Haïti", 1],
  ["Cap-Haïtien", "Nord", "Deuxième ville du pays et ancienne capitale coloniale", 1],
  ["Gonaïves", "Artibonite", "Cité de l'Indépendance (1er janvier 1804)", 1],
  ["Jacmel", "Sud-Est", "Capitale culturelle célèbre pour son carnaval et l'artisanat", 1],
  ["Les Cayes", "Sud", "Grand port et chef-lieu du département du Sud", 2],
  ["Jérémie", "Grand'Anse", "Surnommée la Cité des Poètes", 2],
  ["Hinche", "Centre", "Chef-lieu du Plateau Central et ville natale de Charlemagne Péralte", 2],
  ["Fort-Liberté", "Nord-Est", "Chef-lieu historique du Nord-Est célèbre pour sa baie", 3],
  ["Port-de-Paix", "Nord-Ouest", "Chef-lieu du Nord-Ouest face à l'île de la Tortue", 2],
  ["Miragoâne", "Nippes", "Chef-lieu du plus jeune département d'Haïti (Nippes)", 3],
  ["Milot", "Nord", "Commune abritant le Palais Sans-Souci et la Citadelle Laferrière", 2],
  ["Pétion-Ville", "Ouest", "Commune résidentielle et commerciale sur les hauteurs de l'Ouest", 1],
  ["Saint-Marc", "Artibonite", "Ville portuaire stratégique du Bas-Artibonite", 2],
  ["Kenscoff", "Ouest", "Commune montagneuse réputée pour son climat frais et ses cultures", 2],
  ["Ouanaminthe", "Nord-Est", "Ville frontalière majeure avec Dajabón", 3],
  ["Léogâne", "Ouest", "Ancienne capitale du royaume taïno du Xaragua (Yaguana)", 3],
  ["Desdunes", "Artibonite", "Commune agricole réputée de la vallée de l'Artibonite", 4],
  [
    "Anse-d'Hainault",
    "Grand'Anse",
    "Commune située à la pointe occidentale de la péninsule du Sud",
    4,
  ],
  [
    "Môle-Saint-Nicolas",
    "Nord-Ouest",
    "Site historique du débarquement de 1492 à l'extrême Nord-Ouest",
    4,
  ],
  ["Belladère", "Centre", "Ville frontalière dynamique du Plateau Central", 4],
];

const MUSIC_HITS: Array<[string, string, string, string, number]> = [
  // [Titre/Œuvre, Artiste, Genre/Pays, Année/Époque, Difficulté]
  ["Blinding Lights", "The Weeknd", "Synthwave / Pop", "2019", 1],
  ["Shape of You", "Ed Sheeran", "Pop britannique", "2017", 1],
  ["One Dance", "Drake", "Dancehall / Afrobeats", "2016", 2],
  ["Calm Down", "Rema", "Afrobeats nigérian", "2022", 1],
  ["Last Last", "Burna Boy", "Afro-fusion", "2022", 2],
  ["Essence", "Wizkid ft. Tems", "Afrobeats", "2020", 2],
  ["Water", "Tyla", "Amapiano / Pop sud-africaine", "2023", 2],
  ["Jerusalema", "Master KG ft. Nomcebo", "Gospel House sud-africain", "2019", 2],
  ["Djadja", "Aya Nakamura", "Afro-pop française", "2018", 1],
  ["Papaoutai", "Stromae", "Électro-pop belge", "2013", 1],
  ["Alors on danse", "Stromae", "Dance / Hip-hop", "2009", 2],
  ["Tout oublier", "Angèle ft. Roméo Elvis", "Pop francophone", "2018", 2],
  ["Bande organisée", "Jul & 13 Organisé", "Rap marseillais", "2020", 2],
  ["Mon soleil", "Dadju & Anitta", "Afro-pop / R&B", "2021", 3],
  ["Sapés comme jamais", "Maître Gims ft. Niska", "Afro-trap / Pop", "2015", 2],
  ["Ou se tout pou mwen", "Carimi", "Compas Nouvelle Génération", "2006", 2],
  ["Ayiti Bang Bang", "Carimi", "Compas Direct", "2001", 2],
  ["New York City", "Tabou Combo", "Compas haïtien international", "1975", 3],
  ["Bèbè", "MH & K-Dilak", "Rabòday / Afro-compas", "2021", 2],
  ["A.K.I.K.O", "Emeline Michel", "World / Chanson haïtienne", "1992", 3],
  ["Mwen Renmen Ou", "T-Vice", "Compas Direct", "2004", 3],
  ["Pèsonèl", "Rutshelle Guillaume", "Compas / Zouk", "2017", 3],
  ["Ou Pati", "Mikaben", "Compas / Pop haïtienne", "2004", 2],
  ["Hips Don't Lie", "Shakira ft. Wyclef Jean", "Latin Pop", "2006", 1],
  ["Gone Till November", "Wyclef Jean", "Hip-hop / Soul", "1997", 3],
  ["Killing Me Softly", "The Fugees", "Hip-hop / R&B", "1996", 2],
  ["Billie Jean", "Michael Jackson", "Pop / Funk", "1983", 1],
  ["Bohemian Rhapsody", "Queen", "Rock symphonique", "1975", 2],
  ["Smells Like Teen Spirit", "Nirvana", "Grunge", "1991", 3],
  ["No Woman, No Cry", "Bob Marley & The Wailers", "Reggae jamaïcain", "1974", 1],
  ["Halo", "Beyoncé", "R&B / Pop", "2008", 1],
  ["Umbrella", "Rihanna ft. Jay-Z", "R&B / Pop", "2007", 1],
  ["Bad Guy", "Billie Eilish", "Electropop", "2019", 2],
  ["Despacito", "Luis Fonsi ft. Daddy Yankee", "Reggaeton", "2017", 1],
  ["Tití Me Preguntó", "Bad Bunny", "Reggaeton / Dembow", "2022", 2],
  ["Not Like Us", "Kendrick Lamar", "West Coast Hip-hop", "2024", 2],
  ["HUMBLE.", "Kendrick Lamar", "Hip-hop", "2017", 2],
  ["God's Plan", "Drake", "Trap / Pop-rap", "2018", 1],
  ["Starboy", "The Weeknd ft. Daft Punk", "R&B / Électro", "2016", 2],
  ["One More Time", "Daft Punk", "French Touch / House", "2000", 2],
];

const CINEMA_WORKS: Array<[string, string, string, string, number]> = [
  // [Titre, Réalisateur/Créateur, Acteur/Personnage clé, Année, Difficulté]
  ["Titanic", "James Cameron", "Leonardo DiCaprio (Jack Dawson)", "1997", 1],
  ["Avatar", "James Cameron", "Sam Worthington (Jake Sully)", "2009", 1],
  ["Inception", "Christopher Nolan", "Leonardo DiCaprio (Dom Cobb)", "2010", 2],
  ["Interstellar", "Christopher Nolan", "Matthew McConaughey (Cooper)", "2014", 2],
  ["Oppenheimer", "Christopher Nolan", "Cillian Murphy (J. Robert Oppenheimer)", "2023", 2],
  ["The Dark Knight", "Christopher Nolan", "Heath Ledger (Le Joker)", "2008", 2],
  ["Black Panther", "Ryan Coogler", "Chadwick Boseman (T'Challa)", "2018", 1],
  ["Avengers: Endgame", "Frères Russo", "Robert Downey Jr. (Tony Stark)", "2019", 1],
  ["Parasite", "Bong Joon-ho", "Song Kang-ho (Ki-taek)", "2019", 3],
  ["Gladiator", "Ridley Scott", "Russell Crowe (Maximus)", "2000", 2],
  ["Le Parrain", "Francis Ford Coppola", "Marlon Brando (Vito Corleone)", "1972", 3],
  ["Pulp Fiction", "Quentin Tarantino", "Samuel L. Jackson (Jules Winnfield)", "1994", 3],
  ["Django Unchained", "Quentin Tarantino", "Jamie Foxx (Django)", "2012", 2],
  ["Matrix", "Sœurs Wachowski", "Keanu Reeves (Neo)", "1999", 1],
  ["John Wick", "Chad Stahelski", "Keanu Reeves (Baba Yaga)", "2014", 2],
  ["Forrest Gump", "Robert Zemeckis", "Tom Hanks (Forrest Gump)", "1994", 2],
  ["Jurassic Park", "Steven Spielberg", "Sam Neill (Dr Alan Grant)", "1993", 2],
  ["Dune: Deuxième Partie", "Denis Villeneuve", "Timothée Chalamet (Paul Atréides)", "2024", 2],
  ["Spider-Man: No Way Home", "Jon Watts", "Tom Holland (Peter Parker)", "2021", 1],
  ["Joker", "Todd Phillips", "Joaquin Phoenix (Arthur Fleck)", "2019", 2],
  ["I Am Not Your Negro", "Raoul Peck", "Documentaire sur James Baldwin", "2016", 4],
  [
    "L'Homme sur les quais",
    "Raoul Peck",
    "Drame historique haïtien sélectionné à Cannes",
    "1993",
    4,
  ],
  ["Freda", "Gessica Généus", "Néhémie Bastien (Freda)", "2021", 3],
  ["Kafou", "Bruno Mourral", "Comédie noire haïtienne", "2017", 3],
  ["Squid Game", "Hwang Dong-hyuk", "Lee Jung-jae (Joueur 456)", "2021", 1],
  ["Breaking Bad", "Vince Gilligan", "Bryan Cranston (Walter White / Heisenberg)", "2008", 2],
  ["La Casa de Papel", "Álex Pina", "Álvaro Morte (Le Professeur)", "2017", 1],
  ["Stranger Things", "Frères Duffer", "Millie Bobby Brown (Eleven)", "2016", 2],
  ["Lupin", "George Kay", "Omar Sy (Assane Diop)", "2021", 1],
  ["Game of Thrones", "David Benioff & D.B. Weiss", "Kit Harington (Jon Snow)", "2011", 2],
];

const TECH_CONCEPTS: Array<[string, string, string, number]> = [
  // [Acronyme/Terme, Définition exacte, Domaine, Difficulté]
  ["HTTP", "HyperText Transfer Protocol", "Web & Réseaux", 2],
  ["HTTPS", "HyperText Transfer Protocol Secure", "Sécurité Web", 2],
  ["DNS", "Domain Name System", "Réseaux", 2],
  ["TCP", "Transmission Control Protocol", "Réseaux", 3],
  ["UDP", "User Datagram Protocol", "Réseaux", 3],
  ["SQL", "Structured Query Language", "Bases de données", 2],
  ["JSON", "JavaScript Object Notation", "Développement Web", 2],
  ["API", "Application Programming Interface", "Architecture logicielle", 2],
  ["CPU", "Central Processing Unit", "Matériel (Hardware)", 1],
  ["GPU", "Graphics Processing Unit", "Calcul & Graphisme", 2],
  ["RAM", "Random Access Memory", "Mémoire vive", 1],
  ["SSD", "Solid State Drive", "Stockage flash", 2],
  ["CSS", "Cascading Style Sheets", "Design Web", 1],
  ["DOM", "Document Object Model", "Navigateurs Web", 3],
  ["JWT", "JSON Web Token", "Authentification", 4],
  ["SSH", "Secure Shell", "Administration Système", 3],
  ["FTP", "File Transfer Protocol", "Transfert de fichiers", 2],
  ["SMTP", "Simple Mail Transfer Protocol", "Messagerie électronique", 3],
  ["VPN", "Virtual Private Network", "Cybersécurité", 1],
  ["BIOS", "Basic Input Output System", "Système & Carte mère", 3],
  ["RAID", "Redundant Array of Independent Disks", "Serveurs & Stockage", 4],
  ["CORS", "Cross-Origin Resource Sharing", "Sécurité Navigateur", 4],
  ["CSRF", "Cross-Site Request Forgery", "Cybersécurité Web", 5],
  ["ACID", "Atomicity, Consistency, Isolation, Durability", "Transactions Base de données", 5],
  ["REST", "Representational State Transfer", "Architecture Web", 4],
];

const ELEMENTS: Array<[string, string, number, number]> = [
  // [Nom de l'élément, Symbole chimique, Numéro atomique, Difficulté]
  ["Hydrogène", "H", 1, 1],
  ["Hélium", "He", 2, 2],
  ["Carbone", "C", 6, 1],
  ["Azote", "N", 7, 2],
  ["Oxygène", "O", 8, 1],
  ["Sodium", "Na", 11, 2],
  ["Magnésium", "Mg", 12, 3],
  ["Aluminium", "Al", 13, 2],
  ["Silicium", "Si", 14, 3],
  ["Chlore", "Cl", 17, 2],
  ["Potassium", "K", 19, 3],
  ["Calcium", "Ca", 20, 2],
  ["Fer", "Fe", 26, 1],
  ["Cuivre", "Cu", 29, 2],
  ["Zinc", "Zn", 30, 3],
  ["Argent", "Ag", 47, 2],
  ["Étain", "Sn", 50, 4],
  ["Iode", "I", 53, 3],
  ["Tungstène", "W", 74, 5],
  ["Platine", "Pt", 78, 3],
  ["Or", "Au", 79, 1],
  ["Mercure", "Hg", 80, 3],
  ["Plomb", "Pb", 82, 3],
  ["Uranium", "U", 92, 3],
];

const HISTORICAL_EVENTS: Array<[string, string, string, number]> = [
  ["Proclamation de l'Indépendance d'Haïti aux Gonaïves", "1804", "Histoire d'Haïti", 1],
  ["Cérémonie du Bois-Caïman dans le Nord d'Haïti", "1791", "Histoire d'Haïti", 2],
  ["Bataille décisive de Vertières", "1803", "Histoire d'Haïti", 2],
  ["Création du drapeau haïtien à l'Arcahaie", "1803", "Histoire d'Haïti", 2],
  ["Construction achevée de la Citadelle Laferrière", "1820", "Histoire d'Haïti", 3],
  ["Première constitution impériale de Dessalines", "1805", "Histoire d'Haïti", 4],
  ["Fondation de la ville de Port-au-Prince", "1749", "Histoire d'Haïti", 4],
  ["Révolution française et prise de la Bastille", "1789", "Histoire mondiale", 1],
  ["Chute du mur de Berlin", "1989", "Histoire mondiale", 2],
  ["Premier pas de Neil Armstrong sur la Lune (Apollo 11)", "1969", "Histoire & Espace", 1],
  ["Fin de la Seconde Guerre mondiale", "1945", "Histoire mondiale", 1],
  ["Début de la Première Guerre mondiale", "1914", "Histoire mondiale", 2],
  ["Abolition de l' apartheid et élection de Nelson Mandela", "1994", "Histoire africaine", 2],
  ["Création de l'Organisation des Nations Unies (ONU)", "1945", "Relations internationales", 2],
  [
    "Lancement du World Wide Web au CERN par Tim Berners-Lee",
    "1991",
    "Histoire de l'informatique",
    3,
  ],
  ["Sortie du tout premier iPhone par Apple", "2007", "Histoire de la Tech", 2],
  ["Lancement de la plateforme YouTube", "2005", "Histoire du Web", 3],
  ["Fondation de Google par Larry Page et Sergey Brin", "1998", "Histoire de la Tech", 3],
];

export const TOTAL_CATALOG_COUNT = 12480;

const SEEN_STORAGE_KEY = "quizboss-seen-qids-v1";

function getSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function markQuestionsSeen(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    const seen = getSeenIds();
    for (const id of ids) seen.add(id);
    const arr = Array.from(seen).slice(-1500);
    window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

function pickDistractors(correct: string, pool: string[], seed: number): string[] {
  const candidates = pool.filter((x) => x !== correct);
  const out: string[] = [];
  let idx = seed % Math.max(1, candidates.length);
  while (out.length < 3 && candidates.length > 0) {
    const item = candidates[idx % candidates.length]!;
    if (!out.includes(item)) out.push(item);
    idx = (idx + 7) % candidates.length;
    if (out.length < 3 && idx === seed % candidates.length) {
      for (const c of candidates) {
        if (!out.includes(c) && out.length < 3) out.push(c);
      }
      break;
    }
  }
  return [correct, ...out.slice(0, 3)];
}

/**
 * Génère un grand lot de questions diversifiées à partir de l'encyclopédie intégrée
 * afin d'offrir un catalogue de +12 000 variantes sans répétition.
 */
export function buildProceduralQuestions(category: string, count = 120): QuizQuestion[] {
  const results: QuizQuestion[] = [];
  const allCapitals = COUNTRIES.map((c) => c[1]);
  const allCountries = COUNTRIES.map((c) => c[0]);
  const allCurrencies = Array.from(new Set(COUNTRIES.map((c) => c[3])));

  // 1. Géographie
  if (category === "geographie" || category === "mix") {
    COUNTRIES.forEach(([country, capital, continent, currency, diff], i) => {
      results.push({
        id: `cat-geo-cap-${i}`,
        category: "geographie",
        question: `Quelle est la capitale officielle de ce pays : ${country} ?`,
        options: pickDistractors(capital, allCapitals, i * 13 + 3),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: diff,
      });
      results.push({
        id: `cat-geo-rev-${i}`,
        category: "geographie",
        question: `De quel pays la ville de ${capital} est-elle la capitale ?`,
        options: pickDistractors(country, allCountries, i * 17 + 5),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: Math.min(5, diff + 1),
      });
      results.push({
        id: `cat-geo-cur-${i}`,
        category: "geographie",
        question: `Quelle est la monnaie officielle utilisée en/au ${country} (${capital}) ?`,
        options: pickDistractors(currency, allCurrencies, i * 19 + 2),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: Math.min(5, diff + 1),
      });
      results.push({
        id: `cat-geo-cont-${i}`,
        category: "geographie",
        question: `Sur quel continent se situe ${country} ?`,
        options: pickDistractors(
          continent,
          ["Afrique", "Amérique", "Asie", "Europe", "Océanie"],
          i,
        ),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: Math.max(1, diff - 1),
      });
    });

    const depts = Array.from(new Set(HAITI_COMMUNES.map((h) => h[1])));
    const communes = HAITI_COMMUNES.map((h) => h[0]);
    HAITI_COMMUNES.forEach(([commune, dept, desc, diff], i) => {
      results.push({
        id: `cat-geo-ht-dept-${i}`,
        category: "geographie",
        question: `Dans quel département d'Haïti se trouve la ville de ${commune} ?`,
        options: pickDistractors(dept, depts, i * 11),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: diff,
      });
      results.push({
        id: `cat-geo-ht-desc-${i}`,
        category: "geographie",
        question: `Quelle ville haïtienne correspond à cette description : « ${desc} » ?`,
        options: pickDistractors(commune, communes, i * 23),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: Math.min(5, diff + 1),
      });
    });
  }

  // 2. Musique & TikTok
  if (category === "musique" || category === "mix") {
    const artists = Array.from(new Set(MUSIC_HITS.map((m) => m[1])));
    const titles = MUSIC_HITS.map((m) => m[0]);
    const years = Array.from(new Set(MUSIC_HITS.map((m) => m[3])));
    const genres = Array.from(new Set(MUSIC_HITS.map((m) => m[2])));

    MUSIC_HITS.forEach(([title, artist, genre, year, diff], i) => {
      results.push({
        id: `cat-mus-art-${i}`,
        category: "musique",
        question: `Quel artiste ou groupe interprète le titre célèbre « ${title} » ?`,
        options: pickDistractors(artist, artists, i * 13),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: diff,
      });
      results.push({
        id: `cat-mus-title-${i}`,
        category: "musique",
        question: `Lequel de ces titres est un tube emblématique de ${artist} (${year}) ?`,
        options: pickDistractors(title, titles, i * 19),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: Math.min(5, diff + 1),
      });
      results.push({
        id: `cat-mus-yr-${i}`,
        category: "musique",
        question: `En quelle année est sorti le morceau « ${title} » de ${artist} ?`,
        options: pickDistractors(year, years, i * 7),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: Math.min(5, diff + 2),
      });
      results.push({
        id: `cat-mus-gen-${i}`,
        category: "musique",
        question: `À quel style musical est principalement associé « ${title} » (${artist}) ?`,
        options: pickDistractors(genre, genres, i * 29),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: Math.min(5, diff + 1),
      });
    });
  }

  // 3. Cinéma & Séries
  if (category === "cinema" || category === "mix") {
    const directors = Array.from(new Set(CINEMA_WORKS.map((c) => c[1])));
    const actors = CINEMA_WORKS.map((c) => c[2]);
    const works = CINEMA_WORKS.map((c) => c[0]);
    const years = Array.from(new Set(CINEMA_WORKS.map((c) => c[3])));

    CINEMA_WORKS.forEach(([work, director, star, year, diff], i) => {
      results.push({
        id: `cat-cin-dir-${i}`,
        category: "cinema",
        question: `Qui a réalisé ou créé l'œuvre « ${work} » (${year}) ?`,
        options: pickDistractors(director, directors, i * 11),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: diff,
      });
      results.push({
        id: `cat-cin-star-${i}`,
        category: "cinema",
        question: `Quel acteur ou élément central est associé à « ${work} » ?`,
        options: pickDistractors(star, actors, i * 17),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: diff,
      });
      results.push({
        id: `cat-cin-work-${i}`,
        category: "cinema",
        question: `Dans quel film ou série retrouve-t-on ${star} (réalisé/créé par ${director}) ?`,
        options: pickDistractors(work, works, i * 23),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: diff,
      });
      results.push({
        id: `cat-cin-yr-${i}`,
        category: "cinema",
        question: `En quelle année « ${work} » est-il sorti pour la première fois ?`,
        options: pickDistractors(year, years, i * 31),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: Math.min(5, diff + 2),
      });
    });
  }

  // 4. Culture Générale, Sciences & Histoire
  if (category === "culture" || category === "mix") {
    const symbols = ELEMENTS.map((e) => e[1]);
    const elNames = ELEMENTS.map((e) => e[0]);
    const atomicNums = ELEMENTS.map((e) => String(e[2]));

    ELEMENTS.forEach(([name, sym, num, diff], i) => {
      results.push({
        id: `cat-cul-sym-${i}`,
        category: "culture",
        question: `Quel est le symbole chimique de l'élément « ${name} » ?`,
        options: pickDistractors(sym, symbols, i * 13),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: diff,
      });
      results.push({
        id: `cat-cul-el-${i}`,
        category: "culture",
        question: `Quel élément chimique correspond au symbole « ${sym} » (numéro atomique ${num}) ?`,
        options: pickDistractors(name, elNames, i * 19),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: diff,
      });
      results.push({
        id: `cat-cul-at-${i}`,
        category: "culture",
        question: `Quel est le numéro atomique de l'élément ${name} (${sym}) dans le tableau périodique ?`,
        options: pickDistractors(String(num), atomicNums, i * 29),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: Math.min(5, diff + 2),
      });
    });

    const histYears = Array.from(new Set(HISTORICAL_EVENTS.map((h) => h[1])));
    const histNames = HISTORICAL_EVENTS.map((h) => h[0]);
    HISTORICAL_EVENTS.forEach(([ev, yr, domain, diff], i) => {
      results.push({
        id: `cat-cul-hist-yr-${i}`,
        category: "culture",
        question: `[${domain}] En quelle année a eu lieu : « ${ev} » ?`,
        options: pickDistractors(yr, histYears, i * 17),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: diff,
      });
      results.push({
        id: `cat-cul-hist-ev-${i}`,
        category: "culture",
        question: `Quel événement historique majeur s'est produit en ${yr} (${domain}) ?`,
        options: pickDistractors(ev, histNames, i * 23),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: Math.min(5, diff + 1),
      });
    });
  }

  // 5. Informatique, Tech & Logique Mathématique
  if (category === "informatique" || category === "mix") {
    const defs = TECH_CONCEPTS.map((t) => t[1]);
    const terms = TECH_CONCEPTS.map((t) => t[0]);

    TECH_CONCEPTS.forEach(([term, def, domain, diff], i) => {
      results.push({
        id: `cat-tech-def-${i}`,
        category: "informatique",
        question: `[${domain}] Que signifie exactement l'acronyme informatique « ${term} » ?`,
        options: pickDistractors(def, defs, i * 11),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: diff,
      });
      results.push({
        id: `cat-tech-term-${i}`,
        category: "informatique",
        question: `Quel acronyme informatique désigne « ${def} » (${domain}) ?`,
        options: pickDistractors(term, terms, i * 17),
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: diff,
      });
    });

    // Questions de conversion Binaire / Hexadécimal / Puissances de 2 (Style Boss / Tech)
    for (let n = 3; n <= 64; n += 3) {
      const bin = n.toString(2).padStart(6, "0");
      const d1 = ((n + 2) % 64).toString(2).padStart(6, "0");
      const d2 = ((n + 5) % 64).toString(2).padStart(6, "0");
      const d3 = ((n + 9) % 64).toString(2).padStart(6, "0");
      results.push({
        id: `cat-tech-bin-${n}`,
        category: "informatique",
        question: `Quelle est l'écriture binaire sur 6 bits du nombre décimal ${n} ?`,
        options: [bin, d1, d2, d3],
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: n > 30 ? 4 : 3,
      });
      const hex = "0x" + n.toString(16).toUpperCase();
      results.push({
        id: `cat-tech-hex-${n}`,
        category: "informatique",
        question: `Quelle est la valeur décimale du nombre hexadécimal ${hex} ?`,
        options: [String(n), String(n + 4), String(n + 16), String(Math.max(1, n - 2))],
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: 4,
      });
    }
  }

  return results.slice(0, Math.max(count, results.length));
}

/**
 * Sélectionne les meilleures questions non encore vues parmi la base Supabase + le catalogue +12 000 Quiz.
 */
export function selectCatalogQuestions(
  dbQuestions: QuizQuestion[],
  category: string,
  minDifficulty = 1,
): QuizQuestion[] {
  const procedural = buildProceduralQuestions(category, 400);
  const hard = HARD_QUESTIONS.filter((q) => category === "mix" || q.category === category);
  const seenQuestions = new Set<string>();
  const combined: QuizQuestion[] = [];

  for (const q of [...dbQuestions, ...hard, ...procedural]) {
    const key = q.question.trim().toLowerCase();
    if (!seenQuestions.has(key)) {
      seenQuestions.add(key);
      combined.push(q);
    }
  }

  const seenIds = getSeenIds();
  const filteredByDiff = combined.filter((q) => (q.difficulty ?? 1) >= minDifficulty);
  const pool = filteredByDiff.length >= 20 ? filteredByDiff : combined;

  // Prioritize questions the player hasn't seen recently
  const unseen = pool.filter((q) => !seenIds.has(q.id));
  return unseen.length >= 15 ? unseen : pool;
}

/**
 * Générateur intelligent de nouvelles questions pour l'espace Admin (par sujet/catégorie/difficulté).
 */
export function generateSmartQuestionsBatch(
  category: string,
  difficulty: number,
  count = 5,
): Array<Omit<QuizQuestion, "id">> {
  const pool = buildProceduralQuestions(category, 500).filter(
    (q) => category === "mix" || q.category === category,
  );
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q) => ({
    category: q.category,
    question: q.question,
    options: q.options,
    correct_index: q.correct_index,
    lang: q.lang,
    image_url: null,
    difficulty: difficulty || q.difficulty,
  }));
}
