export type QuizQuestion = {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct_index: number;
  lang: string;
  image_url: string | null;
  difficulty: number;
};

/**
 * Banque intégrée de questions corsées (Difficulté 2 à 5 : Moyen, Difficile, Expert, BOSS)
 * fusionnée automatiquement avec la base de données pour garantir un quiz puissant et compétitif.
 */
export const HARD_QUESTIONS: QuizQuestion[] = [
  // MUSIQUE & TIKTOK (D2 -> D5)
  {
    id: "hq-mus-1",
    category: "musique",
    question: "En quelle année le groupe haïtien Tabou Combo a-t-il été fondé à Pétion-Ville ?",
    options: ["1968", "1955", "1974", "1981"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-mus-2",
    category: "musique",
    question: "Qui est considéré comme le créateur du rythme Compas Direct en Haïti en 1955 ?",
    options: ["Nemours Jean-Baptiste", "Webert Sicot", "Coupe Cloué", "Sweet Micky"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-mus-3",
    category: "musique",
    question:
      "Quel album de Michael Jackson détient le record mondial des ventes avec plus de 65 millions d'exemplaires ?",
    options: ["Bad", "Thriller", "Off the Wall", "Dangerous"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 2,
  },
  {
    id: "hq-mus-4",
    category: "musique",
    question:
      "Ki mizisyen ayisyen ki te fè pati gwoup The Fugees avèk Lauryn Hill ak Pras Michel ?",
    options: ["Wyclef Jean", "Belo", "BIC Tizon Dife", "Mikaben"],
    correct_index: 0,
    lang: "ht",
    image_url: null,
    difficulty: 2,
  },
  {
    id: "hq-mus-5",
    category: "musique",
    question:
      "Quel compositeur classique était complètement sourd lorsqu'il a composé sa 9e Symphonie ?",
    options: [
      "Wolfgang Amadeus Mozart",
      "Ludwig van Beethoven",
      "Jean-Sébastien Bach",
      "Frédéric Chopin",
    ],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-mus-6",
    category: "musique",
    question: "Quelle entreprise chinoise est la maison-mère de l'application TikTok (Douyin) ?",
    options: ["Tencent", "ByteDance", "Alibaba", "Baidu"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-mus-7",
    category: "musique",
    question:
      "Quel rappeur américain a remporté le prix Pulitzer de la musique en 2018 pour son album 'DAMN.' ?",
    options: ["J. Cole", "Kendrick Lamar", "Jay-Z", "Nas"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 4,
  },
  {
    id: "hq-mus-8",
    category: "musique",
    question:
      "Combien de touches (noires et blanches confondues) possède un piano standard moderne ?",
    options: ["76 touches", "84 touches", "88 touches", "92 touches"],
    correct_index: 2,
    lang: "fr",
    image_url: null,
    difficulty: 4,
  },
  {
    id: "hq-mus-9",
    category: "musique",
    question:
      "Quel artiste nigérian a popularisé le genre 'Afro-fusion' et remporté le Grammy du meilleur album mondial avec 'Twice as Tall' ?",
    options: ["Burna Boy", "Wizkid", "Davido", "CKay"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 4,
  },
  {
    id: "hq-mus-10",
    category: "musique",
    question:
      "En théorie musicale, combien de demi-tons séparent une quinte juste dans la gamme tempérée ?",
    options: ["5 demi-tons", "6 demi-tons", "7 demi-tons", "8 demi-tons"],
    correct_index: 2,
    lang: "fr",
    image_url: null,
    difficulty: 5,
  },

  // GÉOGRAPHIE (D2 -> D5)
  {
    id: "hq-geo-1",
    category: "geographie",
    question:
      "Quelle est l'altitude exacte approximative du Pic la Selle, point culminant d'Haïti ?",
    options: ["2 680 m", "1 950 m", "3 098 m", "2 347 m"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 4,
  },
  {
    id: "hq-geo-2",
    category: "geographie",
    question: "Konbyen depatman jewografik ki genyen nan peyi Ayiti ?",
    options: ["8 depatman", "9 depatman", "10 depatman", "12 depatman"],
    correct_index: 2,
    lang: "ht",
    image_url: null,
    difficulty: 2,
  },
  {
    id: "hq-geo-3",
    category: "geographie",
    question: "Quel est le chef-lieu du département des Nippes en Haïti ?",
    options: ["Miragoâne", "Jérémie", "Hinche", "Port-de-Paix"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-geo-4",
    category: "geographie",
    question: "Quel détroit sépare le continent asiatique du continent nord-américain ?",
    options: ["Détroit de Gibraltar", "Détroit de Béring", "Détroit d'Ormuz", "Détroit de Malacca"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-geo-5",
    category: "geographie",
    question: "Quelle est la capitale politique et administrative de l'Australie ?",
    options: ["Sydney", "Melbourne", "Canberra", "Perth"],
    correct_index: 2,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-geo-6",
    category: "geographie",
    question:
      "Quel pays africain possède le plus grand nombre de pyramides anciennes (plus que l'Égypte) ?",
    options: ["Éthiopie", "Soudan", "Libye", "Mali"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 4,
  },
  {
    id: "hq-geo-7",
    category: "geographie",
    question: "Quelle est la fosse océanique la plus profonde de la planète Terre (~10 984 m) ?",
    options: ["Fosse de Porto Rico", "Fosse des Mariannes", "Fosse des Tonga", "Fosse de Java"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-geo-8",
    category: "geographie",
    question:
      "Quel est le seul pays d'Amérique du Sud dont la langue officielle est le néerlandais ?",
    options: ["Guyana", "Suriname", "Belize", "Paraguay"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 4,
  },
  {
    id: "hq-geo-9",
    category: "geographie",
    question:
      "Dans quelle chaîne de montagnes se situe le volcan K2, deuxième plus haut sommet du monde ?",
    options: ["Karakoram", "Cordillère des Andes", "Hindou Kouch", "Caucase"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 5,
  },
  {
    id: "hq-geo-10",
    category: "geographie",
    question: "Quel fleuve traverse le plus grand nombre de pays différents en Europe (10 pays) ?",
    options: ["Le Rhin", "Le Danube", "La Volga", "L'Elbe"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 4,
  },

  // CULTURE GÉNÉRALE (D2 -> D5)
  {
    id: "hq-cul-1",
    category: "culture",
    question:
      "Dans quelle ville haïtienne l'Acte de l'Indépendance a-t-il été signé le 1er janvier 1804 ?",
    options: ["Cap-Haïtien", "Gonaïves", "Vertières", "Saint-Marc"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 2,
  },
  {
    id: "hq-cul-2",
    category: "culture",
    question:
      "Qui a rédigé l'Acte de l'Indépendance d'Haïti en tant que secrétaire de Jean-Jacques Dessalines ?",
    options: ["Louis Boisrond-Tonnerre", "Alexandre Pétion", "Henri Christophe", "Capois-la-Mort"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-cul-3",
    category: "culture",
    question: "Quelle est la date exacte de la célèbre bataille de Vertières en Haïti ?",
    options: ["18 novembre 1803", "18 mai 1803", "14 août 1791", "1er janvier 1804"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-cul-4",
    category: "culture",
    question:
      "Quel écrivain haïtien-canadien a été élu à l'Académie française au fauteuil n°2 en 2013 ?",
    options: ["Dany Laferrière", "René Depestre", "Jean Price-Mars", "Lyonel Trouillot"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-cul-5",
    category: "culture",
    question: "Quel élément chimique porte le numéro atomique 79 et le symbole Au ?",
    options: ["Argent", "Or", "Platine", "Cuivre"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 2,
  },
  {
    id: "hq-cul-6",
    category: "culture",
    question: "Quelle est la vitesse approximative de la lumière dans le vide ?",
    options: ["300 000 km/s", "150 000 km/s", "1 000 000 km/s", "30 000 km/s"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-cul-7",
    category: "culture",
    question: "Quel organe du corps humain consomme environ 20% de l'oxygène total au repos ?",
    options: ["Le cœur", "Le cerveau", "Le foie", "Les poumons"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-cul-8",
    category: "culture",
    question:
      "En quelle année le roi Henri Christophe a-t-il achevé la construction principale de la Citadelle Laferrière ?",
    options: ["1820", "1804", "1844", "1799"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 4,
  },
  {
    id: "hq-cul-9",
    category: "culture",
    question:
      "Quel traité signé en 1697 a officialisé le partage de l'île d'Hispaniola entre la France et l'Espagne ?",
    options: ["Traité de Ryswick", "Traité de Bâle", "Traité d'Aranjuez", "Traité de Versailles"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 5,
  },
  {
    id: "hq-cul-10",
    category: "culture",
    question: "Quel physicien a formulé le principe d'incertitude en mécanique quantique en 1927 ?",
    options: ["Werner Heisenberg", "Niels Bohr", "Erwin Schrödinger", "Max Planck"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 5,
  },

  // CINÉMA & SÉRIES (D2 -> D5)
  {
    id: "hq-cin-1",
    category: "cinema",
    question: "Quel acteur incarne T'Challa dans le film 'Black Panther' (2018) de Marvel ?",
    options: ["Michael B. Jordan", "Chadwick Boseman", "John Boyega", "Daniel Kaluuya"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 2,
  },
  {
    id: "hq-cin-2",
    category: "cinema",
    question: "Quel réalisateur a signé les films 'Inception', 'Interstellar' et 'Oppenheimer' ?",
    options: ["Denis Villeneuve", "Christopher Nolan", "Quentin Tarantino", "David Fincher"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 2,
  },
  {
    id: "hq-cin-3",
    category: "cinema",
    question: "Dans 'Squid Game', quel est le numéro porté par le protagoniste Seong Gi-hun ?",
    options: ["001", "218", "456", "067"],
    correct_index: 2,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-cin-4",
    category: "cinema",
    question:
      "Quel film détient le record historique du plus gros box-office mondial (hors inflation) ?",
    options: ["Avengers: Endgame", "Avatar (2009)", "Titanic", "Star Wars VII"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-cin-5",
    category: "cinema",
    question:
      "Quel cinéaste haïtien a réalisé le documentaire 'Lumumba, la mort du prophète' et 'I Am Not Your Negro' ?",
    options: ["Raoul Peck", "Arnold Antonin", "Richard Sénécal", "rassoul Labuchin"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 4,
  },
  {
    id: "hq-cin-6",
    category: "cinema",
    question:
      "Dans la série 'Breaking Bad', quel est le pseudonyme utilisé par Walter White dans le milieu criminel ?",
    options: ["Heisenberg", "Schrödinger", "Oppenheimer", "Fring"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-cin-7",
    category: "cinema",
    question:
      "Quels sont les trois seuls films de l'histoire à avoir remporté 11 Oscars lors d'une même cérémonie ?",
    options: [
      "Ben-Hur, Titanic, Le Seigneur des Anneaux : Le Retour du Roi",
      "Le Parrain, Titanic, Avatar",
      "Autant en emporte le vent, Gladiator, Oppenheimer",
      "Ben-Hur, La La Land, Titanic",
    ],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 5,
  },
  {
    id: "hq-cin-8",
    category: "cinema",
    question:
      "Dans 'Matrix' (1999), quelle pilule Neo choisit-il d'avaler pour découvrir la vérité ?",
    options: ["La pilule rouge", "La pilule bleue", "La pilule verte", "La pilule dorée"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 2,
  },

  // INFORMATIQUE & TECH (D2 -> D5)
  {
    id: "hq-tech-1",
    category: "informatique",
    question: "Quel port TCP est utilisé par défaut pour le protocole sécurisé HTTPS ?",
    options: ["Port 80", "Port 443", "Port 22", "Port 8080"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-tech-2",
    category: "informatique",
    question: "Qui a créé le noyau Linux en 1991 ainsi que le système de gestion de versions Git ?",
    options: ["Linus Torvalds", "Richard Stallman", "Dennis Ritchie", "Ken Thompson"],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-tech-3",
    category: "informatique",
    question:
      "En algorithmique, quelle est la complexité temporelle moyenne d'une recherche dichotomique (Binary Search) ?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 4,
  },
  {
    id: "hq-tech-4",
    category: "informatique",
    question: "Quelle est la valeur décimale de l'octet binaire 11111111 ?",
    options: ["128", "255", "256", "512"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
  {
    id: "hq-tech-5",
    category: "informatique",
    question:
      "En SQL, quelle clause permet de filtrer les résultats APRÈS un regroupement GROUP BY ?",
    options: ["WHERE", "HAVING", "ORDER BY", "DISTINCT"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 4,
  },
  {
    id: "hq-tech-6",
    category: "informatique",
    question: "Quel protocole réseau traduit un nom de domaine (ex: quizboss.com) en adresse IP ?",
    options: ["DHCP", "DNS", "ARP", "SMTP"],
    correct_index: 1,
    lang: "fr",
    image_url: null,
    difficulty: 2,
  },
  {
    id: "hq-tech-7",
    category: "informatique",
    question:
      "Quel article scientifique publié en 2017 par des chercheurs de Google a introduit l'architecture Transformer en IA ?",
    options: [
      "Attention Is All You Need",
      "Deep Residual Learning",
      "Mastering the Game of Go",
      "ImageNet Classification with Deep CNNs",
    ],
    correct_index: 0,
    lang: "fr",
    image_url: null,
    difficulty: 5,
  },
  {
    id: "hq-tech-8",
    category: "informatique",
    question:
      "Dans le modèle OSI des réseaux informatiques, combien de couches existe-t-il au total ?",
    options: ["4 couches", "5 couches", "7 couches", "8 couches"],
    correct_index: 2,
    lang: "fr",
    image_url: null,
    difficulty: 3,
  },
];

/**
 * Fusionne les questions de la base Supabase avec la banque de questions corsées intégrée,
 * en évitant les doublons de texte et en filtrant par catégorie.
 */
export function mergeWithHardQuestions(
  dbQuestions: QuizQuestion[],
  category: string,
): QuizQuestion[] {
  const seen = new Set(dbQuestions.map((q) => q.question.trim().toLowerCase()));
  const extra = HARD_QUESTIONS.filter(
    (q) =>
      (category === "mix" || q.category === category) && !seen.has(q.question.trim().toLowerCase()),
  );
  return [...dbQuestions, ...extra];
}

export function difficultyBadge(d: number): { label: string; cls: string } {
  if (d >= 5)
    return {
      label: "💀 BOSS",
      cls: "bg-destructive/20 text-destructive border border-destructive/40",
    };
  if (d === 4)
    return { label: "⚡ Expert", cls: "bg-secondary/20 text-secondary border border-secondary/40" };
  if (d === 3)
    return { label: "🔥 Difficile", cls: "bg-accent/20 text-accent border border-accent/40" };
  if (d === 2)
    return { label: "🎯 Moyen", cls: "bg-primary/20 text-primary border border-primary/40" };
  return { label: "✓ Standard", cls: "bg-muted text-muted-foreground" };
}
