import type { QuizQuestion } from "../hardQuestions";
import { dedupeQuestions, pickDistractors } from "./helpers";

export const ELEMENTS: Array<[string, string, number, number]> = [
  ["Hydrogène", "H", 1, 1],
  ["Hélium", "He", 2, 2],
  ["Lithium", "Li", 3, 3],
  ["Carbone", "C", 6, 1],
  ["Azote", "N", 7, 2],
  ["Oxygène", "O", 8, 1],
  ["Fluor", "F", 9, 3],
  ["Néon", "Ne", 10, 2],
  ["Sodium", "Na", 11, 2],
  ["Magnésium", "Mg", 12, 3],
  ["Aluminium", "Al", 13, 2],
  ["Silicium", "Si", 14, 3],
  ["Phosphore", "P", 15, 3],
  ["Soufre", "S", 16, 2],
  ["Chlore", "Cl", 17, 2],
  ["Argon", "Ar", 18, 3],
  ["Potassium", "K", 19, 3],
  ["Calcium", "Ca", 20, 2],
  ["Titane", "Ti", 22, 3],
  ["Fer", "Fe", 26, 1],
  ["Nickel", "Ni", 28, 3],
  ["Cuivre", "Cu", 29, 2],
  ["Zinc", "Zn", 30, 3],
  ["Brome", "Br", 35, 3],
  ["Argent", "Ag", 47, 2],
  ["Iode", "I", 53, 3],
  ["Platine", "Pt", 78, 3],
  ["Or", "Au", 79, 1],
  ["Mercure", "Hg", 80, 2],
  ["Plomb", "Pb", 82, 2],
  ["Uranium", "U", 92, 3],
];

export const LITERATURE_WORKS: Array<[string, string, string, string, number]> = [
  // [Oeuvre, Auteur, Genre, Siècle/Année, Diff]
  ["Gouverneurs de la rosée", "Jacques Roumain", "Roman haïtien paysan", "1944", 1],
  ["Compère Général Soleil", "Jacques Stephen Alexis", "Réalisme merveilleux", "1955", 2],
  ["L'Énigme du retour", "Dany Laferrière", "Autofiction poétique", "2009", 2],
  [
    "Comment faire l'amour avec un nègre sans se fatiguer",
    "Dany Laferrière",
    "Roman satirique",
    "1985",
    2,
  ],
  ["Cahier d'un retour au pays natal", "Aimé Césaire", "Poésie de la Négritude", "1939", 2],
  ["Peau noire, masques blancs", "Frantz Fanon", "Essai anticolonial", "1952", 2],
  ["Les Damnés de la terre", "Frantz Fanon", "Essai politique", "1961", 2],
  ["Les Misérables", "Victor Hugo", "Roman réaliste et humaniste", "1862", 1],
  ["Notre-Dame de Paris", "Victor Hugo", "Roman historique", "1831", 1],
  ["Le Petit Prince", "Antoine de Saint-Exupéry", "Conte philosophique", "1943", 1],
  ["L'Étranger", "Albert Camus", "Roman de l'absurde", "1942", 1],
  ["La Peste", "Albert Camus", "Allégorie philosophique", "1947", 2],
  ["Le Malade imaginaire", "Molière", "Comédie théâtrale", "1673", 1],
  ["Tartuffe", "Molière", "Comédie sur l'hypocrisie", "1664", 1],
  ["Candide", "Voltaire", "Conte philosophique satirique", "1759", 1],
  ["Madame Bovary", "Gustave Flaubert", "Roman réaliste", "1857", 2],
  ["Germinal", "Émile Zola", "Roman naturaliste sur la mine", "1885", 2],
  ["À la recherche du temps perdu", "Marcel Proust", "Roman moderne", "1913", 3],
  ["Roméo et Juliette", "William Shakespeare", "Tragédie théâtrale", "1597", 1],
  ["Hamlet", "William Shakespeare", "Tragédie théâtrale", "1603", 1],
  ["L'Odyssée", "Homère", "Épopée mythologique grecque", "-VIIIe siècle", 1],
  ["L'Iliade", "Homère", "Épopée de la guerre de Troie", "-VIIIe siècle", 1],
  ["La Divine Comédie", "Dante Alighieri", "Poème allégorique", "1320", 2],
  ["Don Quichotte", "Miguel de Cervantes", "Roman picaresque", "1605", 1],
  ["Cent Ans de solitude", "Gabriel García Márquez", "Réalisme magique", "1967", 1],
  ["L'Amour aux temps du choléra", "Gabriel García Márquez", "Roman d'amour", "1985", 2],
  ["Crime et Châtiment", "Fiodor Dostoïevski", "Roman psychologique", "1866", 2],
  ["Guerre et Paix", "Léon Tolstoï", "Fresque historique", "1869", 2],
  ["1984", "George Orwell", "Dystopie totalitaire", "1949", 1],
  ["La Ferme des animaux", "George Orwell", "Fable satirique", "1945", 1],
  ["Le Monde s'effondre", "Chinua Achebe", "Roman africain moderne", "1958", 2],
];

export const PHILOSOPHY_CONCEPTS: Array<[string, string, string, number]> = [
  ["Le Cogito (« Je pense, donc je suis »)", "René Descartes", "Rationalisme", 1],
  ["L'Allégorie de la caverne", "Platon", "Idéalisme & Connaissance", 1],
  ["Le concept d'Impératif catégorique", "Emmanuel Kant", "Éthique déontologique", 2],
  ["La volonté de puissance et le Surhomme", "Friedrich Nietzsche", "Vitalisme", 2],
  [
    "L'Existentialisme (« L'existence précède l'essence »)",
    "Jean-Paul Sartre",
    "Existentialisme",
    1,
  ],
  ["Le contrat social et l'état de nature", "Jean-Jacques Rousseau", "Philosophie politique", 2],
  ["Le Prince (La fin justifie les moyens)", "Nicolas Machiavel", "Réalisme politique", 1],
  ["La maïeutique (l'art de faire accoucher les esprits)", "Socrate", "Philosophie antique", 2],
  ["Le Juste Milieu et l'Éthique à Nicomaque", "Aristote", "Vertu morale", 2],
  ["Le Panthéisme (« Dieu ou la Nature »)", "Baruch Spinoza", "Rationalisme", 3],
  [
    "L'utilitarisme (« Le plus grand bonheur pour le plus grand nombre »)",
    "Jeremy Bentham & John Stuart Mill",
    "Éthique morale",
    3,
  ],
  [
    "La dialectique du maître et de l'esclave",
    "Georg Wilhelm Friedrich Hegel",
    "Idéalisme absolu",
    3,
  ],
  ["Le matérialisme historique et la lutte des classes", "Karl Marx", "Philosophie économique", 1],
  ["L'inconscient psychique et les pulsions", "Sigmund Freud", "Psychanalyse", 1],
  [
    "Le mythe de Sisyphe et le sentiment de l'absurde",
    "Albert Camus",
    "Philosophie de l'absurde",
    2,
  ],
];

export function getCultureQuestions(): QuizQuestion[] {
  const results: QuizQuestion[] = [];
  const elSymbols = ELEMENTS.map((e) => e[1]);
  const elNames = ELEMENTS.map((e) => e[0]);
  const elNums = ELEMENTS.map((e) => String(e[2]));
  const authors = Array.from(new Set(LITERATURE_WORKS.map((l) => l[1])));
  const litTitles = LITERATURE_WORKS.map((l) => l[0]);
  const philPhilosophers = PHILOSOPHY_CONCEPTS.map((p) => p[1]);
  const philConcepts = PHILOSOPHY_CONCEPTS.map((p) => p[0]);

  // Éléments chimiques (3 x 31 = 93)
  ELEMENTS.forEach(([name, sym, num, diff], i) => {
    results.push({
      id: `cul-sym-${i}`,
      category: "culture",
      question: `Quel est le symbole chimique de l'élément « ${name} » ?`,
      options: pickDistractors(sym, elSymbols, i * 13),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `cul-el-${i}`,
      category: "culture",
      question: `Quel élément chimique porte le symbole « ${sym} » (numéro atomique ${num}) ?`,
      options: pickDistractors(name, elNames, i * 17),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `cul-at-${i}`,
      category: "culture",
      question: `Quel est le numéro atomique du ${name} (${sym}) dans la table périodique ?`,
      options: pickDistractors(String(num), elNums, i * 23),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });
  });

  // Littérature (4 x 31 = 124)
  LITERATURE_WORKS.forEach(([title, author, genre, date, diff], i) => {
    results.push({
      id: `cul-lit-aut-${i}`,
      category: "culture",
      question: `Qui est l'auteur du chef-d'œuvre littéraire « ${title} » (${date}) ?`,
      options: pickDistractors(author, authors, i * 11),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `cul-lit-tit-${i}`,
      category: "culture",
      question: `Lequel de ces ouvrages majeurs a été rédigé par ${author} ?`,
      options: pickDistractors(title, litTitles, i * 19),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `cul-lit-gen-${i}`,
      category: "culture",
      question: `À quel genre ou mouvement littéraire est rattaché « ${title} » de ${author} ?`,
      options: [
        genre,
        "Un manuel scolaire de mathématiques",
        "Un recueil de recettes de cuisine",
        "Un guide touristique d'aviation",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });
    results.push({
      id: `cul-lit-dat-${i}`,
      category: "culture",
      question: `À quelle époque ou année approximative a été publié « ${title} » (${author}) ?`,
      options: [date, "L'an 2045", "L'an 500 avant J.-C.", "Le XIXe siècle av. J.-C."],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });
  });

  // Philosophie & Grands Penseurs (3 x 15 = 45)
  PHILOSOPHY_CONCEPTS.forEach(([concept, thinker, domain, diff], i) => {
    results.push({
      id: `cul-phi-thk-${i}`,
      category: "culture",
      question: `À quel philosophe ou penseur associe-t-on la notion : « ${concept} » ?`,
      options: pickDistractors(thinker, philPhilosophers, i * 7),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `cul-phi-cpt-${i}`,
      category: "culture",
      question: `Quelle thèse philosophique fondamentale a été développée par ${thinker} (${domain}) ?`,
      options: pickDistractors(concept, philConcepts, i * 13),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `cul-phi-dom-${i}`,
      category: "culture",
      question: `Dans quel domaine de réflexion s'inscrit « ${concept} » (${thinker}) ?`,
      options: [
        domain,
        "La mécanique automobile",
        "L'agriculture intensive",
        "L'artisanat du cuir",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });
  });

  // 120 Questions encyclopédiques de Culture Générale du Monde
  const GENERAL_CULTURE = [
    [
      "Quelle est la langue la plus parlée au monde en nombre total de locuteurs (natifs + seconde langue) ?",
      "L'anglais",
      ["Le mandarin (chinois)", "L'espagnol", "L'hindi"],
      1,
    ],
    [
      "Quel célèbre tableau de Léonard de Vinci est exposé au musée du Louvre à Paris sous verre blindé ?",
      "La Joconde (Mona Lisa)",
      ["La Cène", "La Dame à l'hermine", "L'Homme de Vitruve"],
      1,
    ],
    [
      "Quel sculpteur italien de la Renaissance a créé les chefs-d'œuvre « David » et « La Pietà » ?",
      "Michel-Ange",
      ["Donatello", "Raphaël", "Bernin"],
      1,
    ],
    [
      "Quelle ville est surnommée la « Ville Éternelle » ?",
      "Rome",
      ["Athènes", "Jérusalem", "Alexandrie"],
      1,
    ],
    [
      "Dans quel pays se trouve le majestueux temple du Taj Mahal, symbole d'amour impérial ?",
      "En Inde",
      ["Au Pakistan", "En Iran", "En Turquie"],
      1,
    ],
    [
      "Quel monument de renommée mondiale a été offert par la France aux États-Unis pour célébrer le centenaire de leur indépendance ?",
      "La Statue de la Liberté",
      ["L'Empire State Building", "Le Golden Gate Bridge", "La Maison-Blanche"],
      1,
    ],
    [
      "Quelle célèbre cathédrale gothique parisienne a subi un grave incendie en avril 2019 ?",
      "Notre-Dame de Paris",
      ["Sacré-Cœur", "Sainte-Chapelle", "Saint-Denis"],
      1,
    ],
    [
      "Combien de merveilles comptaient les célèbres Sept Merveilles du Monde antique ?",
      "7 merveilles",
      ["5 merveilles", "10 merveilles", "12 merveilles"],
      1,
    ],
    [
      "Quelle est la seule merveille du monde antique qui existe encore de nos jours ?",
      "La Grande Pyramide de Gizeh (Khéops)",
      ["Le Colosse de Rhodes", "Le Phare d'Alexandrie", "Les Jardins suspendus de Babylone"],
      2,
    ],
    [
      "Quel est le plus grand musée d'art et d'antiquités au monde par sa superficie ?",
      "Le Musée du Louvre (Paris)",
      ["Le British Museum (Londres)", "Le Metropolitan (New York)", "Le Prado (Madrid)"],
      2,
    ],
    [
      "Quel artiste peintre néerlandais a peint « La Nuit étoilée » et s'est coupé une partie de l'oreille ?",
      "Vincent van Gogh",
      ["Rembrandt", "Claude Monet", "Pablo Picasso"],
      1,
    ],
    [
      "Quel peintre espagnol est le co-fondateur du mouvement cubiste et l'auteur de « Guernica » ?",
      "Pablo Picasso",
      ["Salvador Dalí", "Joan Miró", "Francisco de Goya"],
      1,
    ],
    [
      "Quel peintre surréaliste est célèbre pour ses montres molles dans le tableau « La Persistance de la mémoire » ?",
      "Salvador Dalí",
      ["René Magritte", "Max Ernst", "Paul Klee"],
      2,
    ],
    [
      "Quel compositeur de musique classique devenu sourd a composé la célèbre 9e Symphonie (« Hymne à la joie ») ?",
      "Ludwig van Beethoven",
      ["Wolfgang Amadeus Mozart", "Johann Sebastian Bach", "Frédéric Chopin"],
      1,
    ],
    [
      "Quel prodige autrichien de la musique classique a composé son premier menuet dès l'âge de 5 ans ?",
      "Wolfgang Amadeus Mozart",
      ["Franz Schubert", "Joseph Haydn", "Johannes Brahms"],
      1,
    ],
    [
      "Quel prix international prestigieux est décerné chaque année à Oslo pour la Paix et à Stockholm pour les sciences ?",
      "Le Prix Nobel",
      ["Le Prix Pulitzer", "La Médaille Fields", "Le Prix Goncourt"],
      1,
    ],
    [
      "Quelle femme scientifique a reçu deux prix Nobel dans deux disciplines scientifiques distinctes (Physique et Chimie) ?",
      "Marie Curie",
      ["Rosalind Franklin", "Ada Lovelace", "Lise Meitner"],
      1,
    ],
    [
      "Quel navigateur portugais a commandé la première expédition à réaliser le tour du monde (circumnavigation) en 1519-1522 ?",
      "Fernand de Magellan",
      ["Vasco de Gama", "Christophe Colomb", "Amerigo Vespucci"],
      2,
    ],
    [
      "En quelle année l'Homme a-t-il posé le pied sur la Lune pour la première fois avec la mission Apollo 11 ?",
      "1969",
      ["1961", "1972", "1959"],
      1,
    ],
    [
      "Quel astronaute américain a prononcé : « C'est un petit pas pour l'homme, mais un pas de géant pour l'humanité » ?",
      "Neil Armstrong",
      ["Buzz Aldrin", "Yuri Gagarine", "Michael Collins"],
      1,
    ],
    [
      "Quel aviateur et cosmonaute soviétique a été le tout premier être humain à voyager dans l'espace en 1961 ?",
      "Youri Gagarine",
      ["Alan Shepard", "John Glenn", "Valentina Terechkova"],
      1,
    ],
    [
      "Quel monument haïtien classé au Patrimoine Mondial de l'UNESCO a été conçu pour résister à une invasion française ?",
      "La Citadelle Henry (Laferrière)",
      ["Le Palais des 365 Portes", "Le Fort Jacques", "L'Église Saint-Pierre"],
      1,
    ],
    [
      "Quel palais royal grandiose situé à Milot en Haïti était la résidence officielle du Roi Henri Christophe ?",
      "Le Palais Sans-Souci",
      ["Le Palais National", "Le Palais de Versailles", "Le Palais de l'Élysée"],
      1,
    ],
    [
      "Quel traité signé en 1919 a mis officiellement fin à la Première Guerre mondiale ?",
      "Le Traité de Versailles",
      ["Le Traité de Rome", "Le Traité de Maastricht", "Le Traité d'Utrecht"],
      2,
    ],
    [
      "Combien de pays sont aujourd'hui membres de l'Organisation des Nations Unies (ONU) ?",
      "193 pays",
      ["150 pays", "210 pays", "180 pays"],
      2,
    ],
    [
      "Dans quelle ville américaine se trouve le siège principal des Nations Unies (ONU) ?",
      "New York",
      ["Washington D.C.", "Genève", "San Francisco"],
      1,
    ],
    [
      "Dans quelle ville suisse se trouve le siège européen de l'ONU et de l'Organisation Mondiale de la Santé (OMS) ?",
      "Genève",
      ["Zurich", "Berne", "Bâle"],
      1,
    ],
    [
      "Quelle organisation internationale a pour mission principale de veiller à la stabilité financière et monétaire mondiale ?",
      "Le FMI (Fonds Monétaire International)",
      ["L'UNESCO", "Greenpeace", "La FIFA"],
      1,
    ],
    [
      "Quel empereur romain a légalisé le christianisme dans l'Empire avec l'Édit de Milan en 313 ?",
      "Constantin Ier",
      ["Jules César", "Néron", "Auguste"],
      2,
    ],
    [
      "Quelle était la déesse de la sagesse et de la guerre stratégique dans la mythologie grecque ?",
      "Athéna",
      ["Aphrodite", "Héra", "Artémis"],
      1,
    ],
    [
      "Quel célèbre peintre de la Renaissance a peint la fresque de « La Création d'Adam » au plafond de la chapelle Sixtine ?",
      "Michel-Ange",
      ["Raphaël", "Botticelli", "Titien"],
      1,
    ],
    [
      "Quelle cité antique de Jordanie taillée directement dans la roche rouge est classée parmi les merveilles du monde ?",
      "Pétra",
      ["Palmyre", "Babylone", "Persepolis"],
      2,
    ],
    [
      "Quel grand poète et dramaturge anglais a écrit « Être ou ne pas être, telle est la question » ?",
      "William Shakespeare",
      ["Lord Byron", "John Keats", "Charles Dickens"],
      1,
    ],
    [
      "Quel écrivain français a écrit les célèbres Fables comme « Le Corbeau et le Renard » au XVIIe siècle ?",
      "Jean de La Fontaine",
      ["Jean Racine", "Pierre Corneille", "Nicolas Boileau"],
      1,
    ],
    [
      "Quel fleuve sacré en Inde traverse la ville de Bénarès (Varanasi) ?",
      "Le Gange",
      ["L'Indus", "Le Brahmapoutre", "Le Mékong"],
      2,
    ],
    [
      "Quel océan borde la côte ouest du continent américain ?",
      "L'océan Pacifique",
      ["L'océan Atlantique", "L'océan Indien", "L'océan Arctique"],
      1,
    ],
    [
      "Quel traité signé en 1957 a donné naissance à la Communauté Économique Européenne (CEE) ?",
      "Le Traité de Rome",
      ["Le Traité de Maastricht", "Le Traité de Lisbonne", "Le Traité de Nice"],
      2,
    ],
    [
      "Dans quelle ville italienne se trouve la célèbre Tour penchée située sur la Piazza dei Miracoli ?",
      "Pise",
      ["Florence", "Venise", "Milan"],
      1,
    ],
    [
      "Quel écrivain haïtien membre de l'Académie française a écrit « Le Charme des après-midi sans fin » ?",
      "Dany Laferrière",
      ["Gary Victor", "Lyonel Trouillot", "Frankétienne"],
      1,
    ],
    [
      "Quel philosophe des Lumières a rédigé « L'Esprit des lois » et théorisé la séparation des pouvoirs ?",
      "Montesquieu",
      ["Voltaire", "Rousseau", "Diderot"],
      2,
    ],
  ];

  GENERAL_CULTURE.forEach(([qText, correct, wrongs, diff], i) => {
    results.push({
      id: `cul-gen-a-${i}`,
      category: "culture",
      question: qText,
      options: [correct, ...wrongs],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `cul-gen-b-${i}`,
      category: "culture",
      question: `[Culture Générale] Quelle affirmation exacte correspond à : « ${correct} » ?`,
      options: [
        qText,
        "C'est une théorie astronomique réfutée",
        "C'est une légende sans fondement historique",
        "C'est une invention du XXIe siècle",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });
    results.push({
      id: `cul-gen-c-${i}`,
      category: "culture",
      question: `Dans quel domaine de culture générale classe-t-on la question suivante : « ${qText} » ?`,
      options: [
        "Histoire, Art et Connaissance du Monde",
        "Recettes de pâtisserie",
        "Mode vestimentaire canine",
        "Plomberie domestique",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
  });

  return dedupeQuestions(results);
}
