import type { QuizQuestion } from "../hardQuestions";
import { dedupeQuestions, pickDistractors } from "./helpers";

export const COUNTRIES: Array<[string, string, string, string, number]> = [
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
  ["Islande", "Reykjavik", "Europe", "Couronne islandaise", 3],
  ["Finlande", "Helsinki", "Europe", "Euro", 2],
  ["Danemark", "Copenhague", "Europe", "Couronne danoise", 2],
  ["Irlande", "Dublin", "Europe", "Euro", 2],
  ["Autriche", "Vienne", "Europe", "Euro", 2],
  ["Hongrie", "Budapest", "Europe", "Forint", 3],
  ["Tchéquie", "Prague", "Europe", "Couronne tchèque", 2],
  ["Roumanie", "Bucarest", "Europe", "Leu roumain", 3],
  ["Bulgarie", "Sofia", "Europe", "Lev", 3],
  ["Croatie", "Zagreb", "Europe", "Euro", 3],
  ["Serbie", "Belgrade", "Europe", "Dinar serbe", 3],
];

export const HAITI_COMMUNES: Array<[string, string, string, number]> = [
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
  ["Ouanaminthe", "Nord-Est", "Ville frontière majeure avec Dajabón", 2],
  ["Léogâne", "Ouest", "Cité d'Anacaona et berceau du Rara", 2],
  ["Petit-Goâve", "Ouest", "Célèbre pour le Douce Makòs et le Fort Royal", 2],
  ["Grand-Goâve", "Ouest", "Une des plus anciennes communes d'Haïti", 3],
  ["Kenscoff", "Ouest", "Commune d'altitude connue pour son climat frais et ses maraîchages", 3],
  ["Arcahaie", "Ouest", "Cité du Drapeau haïtien créé le 18 mai 1803", 1],
  ["Cabaret", "Ouest", "Commune côtière de la côte des Arcadins", 2],
  ["Mirebalais", "Centre", "Ville carrefour abritant l'Hôpital universitaire de Mirebalais", 2],
  ["Belladère", "Centre", "Point de passage frontalier stratégique avec Elías Piña", 3],
  ["Trou-du-Nord", "Nord-Est", "Commune agricole réputée pour ses bananeraies", 3],
  ["Limonade", "Nord", "Commune abritant le campus universitaire Roi Henri Christophe", 3],
  ["Acul-du-Nord", "Nord", "Commune historique où se trouve l'Habitation Choiseul", 3],
];

export const GEO_LANDMARKS: Array<[string, string, string, number]> = [
  ["Le Nil", "Le plus long fleuve d'Afrique traversant notamment l'Égypte", "Fleuve", 1],
  ["L'Amazone", "Le fleuve le plus puissant au monde situé en Amérique du Sud", "Fleuve", 1],
  ["L'Everest", "Le plus haut sommet du globe (8 849 m) dans l'Himalaya", "Montagne", 1],
  [
    "Le Mont Kilimandjaro",
    "Le point culminant de l'Afrique situé en Tanzanie (5 895 m)",
    "Montagne",
    2,
  ],
  [
    "La fosse des Mariannes",
    "L'endroit le plus profond de la Terre (-11 000 m) dans l'océan Pacifique",
    "Océan",
    3,
  ],
  ["Le Sahara", "Le plus vaste désert chaud du monde situé au nord de l'Afrique", "Désert", 1],
  [
    "La Citadelle Laferrière",
    "Plus grande forteresse des Amériques érigée par Henri Christophe en Haïti",
    "Monument",
    1,
  ],
  [
    "Le Canal de Panama",
    "Canal artificiel reliant l'océan Atlantique à l'océan Pacifique",
    "Détroit",
    2,
  ],
  ["Le Canal de Suez", "Canal reliant la mer Méditerranée à la mer Rouge en Égypte", "Détroit", 2],
  ["Le lac Baïkal", "Le lac le plus profond et le plus ancien du monde en Russie", "Lac", 3],
  [
    "La mer Morte",
    "Le point émergé le plus bas de la Terre réputé pour sa très forte salinité",
    "Mer",
    2,
  ],
  [
    "Le Mont Blanc",
    "Le plus haut sommet d'Europe occidentale (4 807 m) dans les Alpes",
    "Montagne",
    2,
  ],
  ["Le détroit de Gibraltar", "Le bras de mer séparant l'Espagne du Maroc", "Détroit", 2],
  [
    "Le détroit de Béring",
    "Le bras de mer séparant la Russie (Asie) de l'Alaska (Amérique)",
    "Détroit",
    3,
  ],
  ["Le lac Titicaca", "Le plus haut lac navigable au monde entre la Bolivie et le Pérou", "Lac", 3],
];

export function getGeographieQuestions(): QuizQuestion[] {
  const results: QuizQuestion[] = [];
  const allCapitals = COUNTRIES.map((c) => c[1]);
  const allCountries = COUNTRIES.map((c) => c[0]);
  const allCurrencies = Array.from(new Set(COUNTRIES.map((c) => c[3])));
  const allDepts = Array.from(new Set(HAITI_COMMUNES.map((h) => h[1])));
  const allCommunes = HAITI_COMMUNES.map((h) => h[0]);

  COUNTRIES.forEach(([country, capital, continent, currency, diff], i) => {
    // 1. Capitale
    results.push({
      id: `geo-cap-${i}`,
      category: "geographie",
      question: `Quelle est la capitale officielle de ce pays : ${country} ?`,
      options: pickDistractors(capital, allCapitals, i * 13 + 3),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });

    // 2. Pays inversé
    results.push({
      id: `geo-rev-${i}`,
      category: "geographie",
      question: `De quel pays la ville de ${capital} est-elle la capitale ?`,
      options: pickDistractors(country, allCountries, i * 17 + 5),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });

    // 3. Monnaie
    results.push({
      id: `geo-cur-${i}`,
      category: "geographie",
      question: `Quelle est la monnaie officielle utilisée en/au ${country} (${capital}) ?`,
      options: pickDistractors(currency, allCurrencies, i * 19 + 2),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });

    // 4. Continent
    results.push({
      id: `geo-cont-${i}`,
      category: "geographie",
      question: `Sur quel continent se situe ${country} ?`,
      options: pickDistractors(continent, ["Afrique", "Amérique", "Asie", "Europe", "Océanie"], i),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.max(1, diff - 1),
    });
  });

  HAITI_COMMUNES.forEach(([commune, dept, desc, diff], i) => {
    results.push({
      id: `geo-ht-dept-${i}`,
      category: "geographie",
      question: `Dans quel département d'Haïti se trouve la ville de ${commune} ?`,
      options: pickDistractors(dept, allDepts, i * 11),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `geo-ht-desc-${i}`,
      category: "geographie",
      question: `Quelle commune haïtienne correspond à : « ${desc} » ?`,
      options: pickDistractors(commune, allCommunes, i * 23),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });
  });

  GEO_LANDMARKS.forEach(([name, desc, type, diff], i) => {
    results.push({
      id: `geo-lnd-${i}`,
      category: "geographie",
      question: `[Géographie du Monde] Quel élément géographique correspond à : « ${desc} » ?`,
      options: pickDistractors(
        name,
        GEO_LANDMARKS.map((l) => l[0]),
        i * 7,
      ),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
  });

  return dedupeQuestions(results);
}
