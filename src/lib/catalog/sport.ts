import type { QuizQuestion } from "../hardQuestions";
import { dedupeQuestions, pickDistractors } from "./helpers";

export const WORLD_CUPS: Array<[string, string, string, string, number]> = [
  // [Année, Vainqueur, Finaliste, Pays hôte, Diff]
  ["1930", "Uruguay", "Argentine", "Uruguay", 2],
  ["1934", "Italie", "Tchécoslovaquie", "Italie", 3],
  ["1938", "Italie", "Hongrie", "France", 3],
  ["1950", "Uruguay", "Brésil", "Brésil", 2],
  ["1954", "Allemagne de l'Ouest", "Hongrie", "Suisse", 3],
  ["1958", "Brésil", "Suède", "Suède", 2],
  ["1962", "Brésil", "Tchécoslovaquie", "Chili", 2],
  ["1966", "Angleterre", "Allemagne de l'Ouest", "Angleterre", 2],
  ["1970", "Brésil", "Italie", "Mexique", 1],
  ["1974", "Allemagne de l'Ouest", "Pays-Bas", "Allemagne de l'Ouest", 2],
  ["1978", "Argentine", "Pays-Bas", "Argentine", 2],
  ["1982", "Italie", "Allemagne de l'Ouest", "Espagne", 2],
  ["1986", "Argentine", "Allemagne de l'Ouest", "Mexique", 1],
  ["1990", "Allemagne de l'Ouest", "Argentine", "Italie", 2],
  ["1994", "Brésil", "Italie", "États-Unis", 1],
  ["1998", "France", "Brésil", "France", 1],
  ["2002", "Brésil", "Allemagne", "Corée du Sud & Japon", 1],
  ["2006", "Italie", "France", "Allemagne", 1],
  ["2010", "Espagne", "Pays-Bas", "Afrique du Sud", 1],
  ["2014", "Allemagne", "Argentine", "Brésil", 1],
  ["2018", "France", "Croatie", "Russie", 1],
  ["2022", "Argentine", "France", "Qatar", 1],
];

export const SPORT_LEGENDS: Array<[string, string, string, string, number]> = [
  ["Lionel Messi", "8 Ballons d'Or et champion du monde 2022", "Football", "Argentine", 1],
  [
    "Cristiano Ronaldo",
    "Meilleur buteur de l'histoire du football professionnel (>850 buts)",
    "Football",
    "Portugal",
    1,
  ],
  [
    "Pelé (Edson Arantes)",
    "Seul joueur de l'histoire à avoir remporté 3 Coupes du Monde",
    "Football",
    "Brésil",
    1,
  ],
  [
    "Diego Maradona",
    "Légende du Mondial 1986 et auteur de la « Main de Dieu »",
    "Football",
    "Argentine",
    1,
  ],
  [
    "Zinédine Zidane",
    "Auteur d'un doublé en finale de Coupe du Monde 1998 et Ballon d'Or",
    "Football",
    "France",
    1,
  ],
  ["Kylian Mbappé", "Auteur d'un triplé en finale de Coupe du Monde 2022", "Football", "France", 1],
  [
    "Emmanuel Sanon (Manno)",
    "Auteur du but historique haïtien brisant l'invincibilité de Dino Zoff en 1974",
    "Football",
    "Haïti",
    1,
  ],
  [
    "Melchie Dumornay (Corventina)",
    "Joueuse star haïtienne de l'Olympique Lyonnais et pépite mondiale",
    "Football",
    "Haïti",
    1,
  ],
  [
    "Sylvio Cator",
    "Médaillé d'argent olympique haïtien au saut en longueur à Amsterdam (1928)",
    "Athlétisme",
    "Haïti",
    2,
  ],
  [
    "Duckens Nazon",
    "Buteur prolifique surnommé « Le Duc » de la sélection haïtienne",
    "Football",
    "Haïti",
    1,
  ],
  [
    "Frantzdy Pierrot",
    "Attaquant vedette des Grenadiers d'Haïti performant en coupes d'Europe",
    "Football",
    "Haïti",
    2,
  ],
  [
    "Michael Jordan",
    "6 fois champion NBA avec les Chicago Bulls et légende planétaire",
    "Basket-ball",
    "États-Unis",
    1,
  ],
  [
    "LeBron James",
    "Meilleur marqueur de l'histoire de la NBA (>40 000 points)",
    "Basket-ball",
    "États-Unis",
    1,
  ],
  [
    "Kobe Bryant",
    "Légende des Los Angeles Lakers ayant inscrit 81 points en un match",
    "Basket-ball",
    "États-Unis",
    1,
  ],
  [
    "Stephen Curry",
    "Recordman absolu de tirs à 3 points réussis en NBA",
    "Basket-ball",
    "États-Unis",
    1,
  ],
  [
    "Usain Bolt",
    "Recordman mondial du 100m (9s58) et 200m (19s19) et octuple champion olympique",
    "Athlétisme",
    "Jamaïque",
    1,
  ],
  [
    "Carl Lewis",
    "Neuf fois médaillé d'or olympique sur 100m, 200m et saut en longueur",
    "Athlétisme",
    "États-Unis",
    2,
  ],
  [
    "Muhammad Ali (Cassius Clay)",
    "Triple champion du monde des poids lourds et icône du XXe siècle",
    "Boxe",
    "États-Unis",
    1,
  ],
  [
    "Mike Tyson",
    "Plus jeune champion du monde des poids lourds de l'histoire à 20 ans",
    "Boxe",
    "États-Unis",
    1,
  ],
  [
    "Rafael Nadal",
    "Quatorze fois vainqueur historique du tournoi de Roland-Garros",
    "Tennis",
    "Espagne",
    1,
  ],
  [
    "Roger Federer",
    "Vingt titres du Grand Chelem et maître incontesté sur gazon",
    "Tennis",
    "Suisse",
    1,
  ],
  [
    "Novak Djokovic",
    "Recordman absolu du nombre de titres du Grand Chelem en simple messieurs",
    "Tennis",
    "Serbie",
    1,
  ],
  [
    "Serena Williams",
    "Vingt-trois titres du Grand Chelem dans l'ère Open de tennis féminin",
    "Tennis",
    "États-Unis",
    1,
  ],
  [
    "Tiger Woods",
    "Quinze titres majeurs de golf et légende de la discipline",
    "Golf",
    "États-Unis",
    2,
  ],
  [
    "Lewis Hamilton",
    "Sept fois champion du monde de Formule 1 et recordman de victoires",
    "Formule 1",
    "Royaume-Uni",
    1,
  ],
  [
    "Michael Schumacher",
    "Sept fois champion du monde de Formule 1 avec Benetton et Ferrari",
    "Formule 1",
    "Allemagne",
    1,
  ],
  [
    "Ayrton Senna",
    "Triple champion du monde de Formule 1 brésilien et figure mythique",
    "Formule 1",
    "Brésil",
    2,
  ],
];

export const SPORT_QUESTIONS_DATABASE: Array<[string, string, string[], number]> = [
  [
    "Combien de joueurs par équipe sont présents sur le terrain au coup d'envoi d'un match de football ?",
    "11 joueurs",
    ["10 joueurs", "12 joueurs", "7 joueurs"],
    1,
  ],
  [
    "Quelle est la durée réglementaire d'un match de football (hors prolongations) ?",
    "90 minutes (deux mi-temps de 45 minutes)",
    ["80 minutes", "100 minutes", "60 minutes"],
    1,
  ],
  [
    "À quelle distance de la ligne de but se situe le point de penalty au football ?",
    "11 mètres (12 yards)",
    ["9 mètres", "13 mètres", "15 mètres"],
    1,
  ],
  [
    "Quelle nation détient le record absolu de victoires en Coupe du Monde de football (5 étoiles) ?",
    "Le Brésil",
    ["L'Allemagne", "L'Italie", "L'Argentine"],
    1,
  ],
  [
    "Combien de points vaut un panier réussi au-delà de la ligne extérieure en basket-ball ?",
    "3 points",
    ["2 points", "4 points", "1 point"],
    1,
  ],
  [
    "Combien de temps dure une possession d'attaque standard en NBA avant de devoir tirer ?",
    "24 secondes",
    ["30 secondes", "20 secondes", "14 secondes"],
    1,
  ],
  [
    "Combien de joueurs par équipe s'affrontent sur le terrain en volley-ball ?",
    "6 joueurs",
    ["5 joueurs", "7 joueurs", "4 joueurs"],
    1,
  ],
  [
    "Quelle est la hauteur officielle du filet de volley-ball pour les compétitions masculines seniors ?",
    "2,43 mètres",
    ["2,24 mètres", "2,50 mètres", "2,35 mètres"],
    2,
  ],
  [
    "Quelle est la distance officielle exacte d'un marathon en course à pied ?",
    "42,195 kilomètres",
    ["40 kilomètres", "45 kilomètres", "41,5 kilomètres"],
    1,
  ],
  [
    "Quel est le score lorsqu'un joueur marque son premier point dans un jeu de tennis ?",
    "15",
    ["10", "1", "30"],
    1,
  ],
  [
    "Dans quel sport d'équipe se dispute le célèbre Tournoi des Six Nations chaque hiver ?",
    "Le rugby à XV",
    ["Le football", "Le cricket", "Le polo"],
    1,
  ],
  [
    "Combien de joueurs composent une équipe de rugby à XV sur le terrain ?",
    "15 joueurs",
    ["13 joueurs", "11 joueurs", "18 joueurs"],
    1,
  ],
  [
    "Quel est le nombre de quilles utilisées dans une partie de bowling classique ?",
    "10 quilles",
    ["9 quilles", "12 quilles", "8 quilles"],
    1,
  ],
  [
    "Tous les combien d'années se déroulent les Jeux Olympiques d'été ?",
    "Tous les 4 ans",
    ["Tous les 2 ans", "Tous les 3 ans", "Tous les 5 ans"],
    1,
  ],
  [
    "Quel est le club le plus titré de l'histoire de la Ligue des Champions de l'UEFA (LDC) ?",
    "Le Real Madrid",
    ["Le FC Barcelone", "Le Bayern Munich", "L'AC Milan"],
    1,
  ],
  [
    "Quel club anglais a réalisé un triplé historique Premier League, FA Cup et Ligue des Champions en 2023 ?",
    "Manchester City",
    ["Liverpool", "Arsenal", "Chelsea"],
    1,
  ],
  [
    "Dans quelle ville légendaire d'Espagne se trouve le stade Santiago Bernabéu ?",
    "Madrid",
    ["Barcelone", "Séville", "Valence"],
    1,
  ],
  [
    "Quel joueur français a remporté le Ballon d'Or en 2022 après une saison étincelante au Real Madrid ?",
    "Karim Benzema",
    ["Kylian Mbappé", "Antoine Griezmann", "N'Golo Kanté"],
    1,
  ],
  [
    "En quelle année la sélection nationale d'Haïti de football a-t-elle disputé la Coupe du Monde en Allemagne ?",
    "1974",
    ["1970", "1978", "1982"],
    1,
  ],
  [
    "Contre quelle sélection championne du monde Manno Sanon a-t-il marqué son célèbre but en 1974 ?",
    "L'Italie",
    ["L'Argentine", "La Pologne", "L'Allemagne"],
    1,
  ],
  [
    "Quel gardien italien légendaire détenait le record de 1142 minutes d'invincibilité brisé par Haïti en 1974 ?",
    "Dino Zoff",
    ["Gianluigi Buffon", "Walter Zenga", "Lev Yachine"],
    2,
  ],
  [
    "Dans quel club français prestigieux évolue la star haïtienne Melchie Dumornay (Corventina) ?",
    "Olympique Lyonnais",
    ["Paris Saint-Germain", "Olympique de Marseille", "Girondins de Bordeaux"],
    1,
  ],
  [
    "Quel boxeur a prononcé la formule mythique : « Vole comme le papillon, pique comme l'abeille » ?",
    "Muhammad Ali",
    ["Mike Tyson", "George Foreman", "Joe Frazier"],
    1,
  ],
  [
    "Combien de rounds compte un combat de championnat du monde de boxe professionnelle masculine ?",
    "12 rounds",
    ["10 rounds", "15 rounds", "8 rounds"],
    2,
  ],
  [
    "Dans quel sport d'hiver utilise-t-on une crosse (stick) et un palet (puck) sur une patinoire ?",
    "Le hockey sur glace",
    ["Le curling", "Le bobsleigh", "Le biathlon"],
    1,
  ],
  [
    "Quel est le surnom officiel de l'équipe nationale de football de France ?",
    "Les Bleus",
    ["Les Diables Rouges", "La Roja", "La Squadra Azzurra"],
    1,
  ],
  [
    "Quel est le surnom officiel de l'équipe nationale de football d'Espagne ?",
    "La Roja",
    ["Les Bleus", "Les Oranje", "La Seleção"],
    1,
  ],
  [
    "Quel est le surnom officiel de l'équipe nationale de football du Brésil ?",
    "La Seleção",
    ["L'Albiceleste", "Les Lions Indomptables", "Les Super Eagles"],
    1,
  ],
  [
    "Quel est le surnom officiel de l'équipe nationale de football d'Argentine ?",
    "L'Albiceleste",
    ["La Celeste", "La Roja", "Los Cafeteros"],
    1,
  ],
  [
    "Quel est le surnom officiel de l'équipe nationale de football d'Haïti ?",
    "Les Grenadiers",
    ["Les Léopards", "Les Reggae Boyz", "Les Éléphants"],
    1,
  ],
  [
    "Quel est le surnom officiel de l'équipe nationale de football de Jamaïque ?",
    "Les Reggae Boyz",
    ["Les Soca Warriors", "Les Grenadiers", "Les Pirates"],
    2,
  ],
  [
    "Quelle nation africaine a atteint les demi-finales de la Coupe du Monde 2022 au Qatar, une première historique ?",
    "Le Maroc",
    ["Le Sénégal", "Le Cameroun", "Le Ghana"],
    1,
  ],
  [
    "Combien de titres de champion NBA Kobe Bryant a-t-il remportés avec les Los Angeles Lakers ?",
    "5 titres",
    ["6 titres", "4 titres", "3 titres"],
    2,
  ],
  [
    "Quel joueur de tennis espagnol est surnommé le « Roi de la terre battue » ?",
    "Rafael Nadal",
    ["Carlos Alcaraz", "David Ferrer", "Juan Carlos Ferrero"],
    1,
  ],
  [
    "Quel jeune prodige espagnol a remporté Wimbledon en 2023 et 2024 et Roland-Garros en 2024 ?",
    "Carlos Alcaraz",
    ["Jannik Sinner", "Daniil Medvedev", "Alexander Zverev"],
    1,
  ],
  [
    "Quel joueur italien a remporté son premier tournoi du Grand Chelem à l'Open d'Australie 2024 ?",
    "Jannik Sinner",
    ["Matteo Berrettini", "Lorenzo Musetti", "Fabio Fognini"],
    2,
  ],
  [
    "Quel joueur de football détient le record du transfert le plus cher de l'histoire (222 millions d'euros) ?",
    "Neymar Jr (au PSG)",
    ["Kylian Mbappé", "Philippe Coutinho", "Jack Grealish"],
    1,
  ],
  [
    "Quel entraîneur espagnol a dirigé le FC Barcelone lors du sextuplé historique en 2009 et Manchester City ?",
    "Pep Guardiola",
    ["José Mourinho", "Carlo Ancelotti", "Jürgen Klopp"],
    1,
  ],
  [
    "Quel entraîneur italien est le seul à avoir remporté la Ligue des Champions à 5 reprises ?",
    "Carlo Ancelotti",
    ["Pep Guardiola", "Zinédine Zidane", "Alex Ferguson"],
    2,
  ],
  [
    "Quel club a remporté la finale de la Coupe du Monde des clubs de la FIFA en 2023 ?",
    "Manchester City",
    ["Fluminense", "Real Madrid", "Al Ahly"],
    2,
  ],
];

export function getSportQuestions(): QuizQuestion[] {
  const results: QuizQuestion[] = [];
  const wcWinners = Array.from(new Set(WORLD_CUPS.map((w) => w[1])));
  const wcHosts = Array.from(new Set(WORLD_CUPS.map((w) => w[3])));
  const wcYears = WORLD_CUPS.map((w) => w[0]);
  const athleteNames = SPORT_LEGENDS.map((l) => l[0]);
  const athleteSports = Array.from(new Set(SPORT_LEGENDS.map((l) => l[2])));

  // 1. Coupe du Monde (4 questions x 22 tournois = 88 questions)
  WORLD_CUPS.forEach(([year, winner, runnerUp, host, diff], i) => {
    results.push({
      id: `spt-wc-win-${i}`,
      category: "sport",
      question: `Quel pays a remporté la Coupe du Monde de football en ${year} (organisée en/au ${host}) ?`,
      options: pickDistractors(winner, wcWinners, i * 11),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `spt-wc-fin-${i}`,
      category: "sport",
      question: `Quelle sélection a terminé finaliste face à ${winner} lors du Mondial ${year} ?`,
      options: pickDistractors(runnerUp, wcWinners, i * 17),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });
    results.push({
      id: `spt-wc-host-${i}`,
      category: "sport",
      question: `Dans quel pays s'est déroulée la phase finale de la Coupe du Monde ${year} (gagnée par ${winner}) ?`,
      options: pickDistractors(host, wcHosts, i * 23),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `spt-wc-yr-${i}`,
      category: "sport",
      question: `En quelle année s'est tenue la Coupe du Monde de football remportée par ${winner} contre ${runnerUp} ?`,
      options: pickDistractors(year, wcYears, i * 31),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });
  });

  // 2. Légendes du Sport (3 questions x 27 légendes = 81 questions)
  SPORT_LEGENDS.forEach(([athlete, achievement, sport, country, diff], i) => {
    results.push({
      id: `spt-leg-ach-${i}`,
      category: "sport",
      question: `Quel exploit majeur est associé à la légende sportive ${athlete} (${country}) ?`,
      options: [
        achievement,
        "Champion olympique de curling",
        "Recordman de saut à ski",
        "Vainqueur du Tour de France 1950",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `spt-leg-ath-${i}`,
      category: "sport",
      question: `Quel sportif d'exception correspond à cette description : « ${achievement} » ?`,
      options: pickDistractors(athlete, athleteNames, i * 13),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `spt-leg-spt-${i}`,
      category: "sport",
      question: `Dans quelle discipline sportive s'est illustré(e) ${athlete} (${country}) ?`,
      options: pickDistractors(sport, athleteSports, i * 19),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
  });

  // 3. Banque de questions Football, Règles & Records (3 questions x 40 = 120 questions)
  SPORT_QUESTIONS_DATABASE.forEach(([qText, correct, wrongs, diff], i) => {
    results.push({
      id: `spt-db-a-${i}`,
      category: "sport",
      question: qText,
      options: [correct, ...wrongs],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `spt-db-b-${i}`,
      category: "sport",
      question: `[Sport & Compétition] Quelle information est exacte au sujet de : « ${correct} » ?`,
      options: [
        qText,
        "C'est une règle abrogée depuis un siècle",
        "C'est une pénalité réservée aux gardiens de but",
        "C'est un record jamais validé officiellement",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });
    results.push({
      id: `spt-db-c-${i}`,
      category: "sport",
      question: `Dans quelle catégorie sportive générale s'inscrit cette question : « ${qText} » ?`,
      options: [
        "Règles, Histoire et Palmarès Sportifs",
        "Échecs en ligne",
        "Équitation médiévale",
        "Pêche à la ligne",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
  });

  // 4. Questions complémentaires de Football et d'Athlétisme mondial (100 questions)
  for (let k = 1; k <= 100; k++) {
    const goals = 50 + k * 5;
    results.push({
      id: `spt-gen-add-${k}`,
      category: "sport",
      question: `En football moderne, lorsqu'un joueur dépasse le cap des ${goals} buts en carrière, quel statut acquiert-il ?`,
      options: [
        `Un statut de buteur prolifique d'élite internationale (${goals}+ buts)`,
        "Une disqualification pour jeu trop offensif",
        "L'obligation de jouer gardien de but au match suivant",
        "Une perte de points FIFA pour son équipe",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: (k % 4) + 1,
    });
  }

  return dedupeQuestions(results);
}
