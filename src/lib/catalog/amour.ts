// @ts-nocheck -- tableaux de données hétérogènes, validés à l'exécution
import type { QuizQuestion } from "../hardQuestions";
import { dedupeQuestions, pickDistractors } from "./helpers";

// Données authentiques : théories relationnelles, communication de couple, psychologie amoureuse
const AMOUR_CORE_QA: Array<[string, string, string[], number]> = [
  // 1. Les 5 Langages de l'Amour (Gary Chapman)
  [
    "Selon Gary Chapman, lequel de ces éléments N'EST PAS l'un des 5 langages fondamentaux de l'amour ?",
    "La comparaison sociale",
    ["Les paroles valorisantes", "Les moments de qualité", "Le toucher physique"],
    1,
  ],
  [
    "Quel langage de l'amour consiste à se sentir aimé lorsque son partenaire nous aide spontanément dans une corvée ?",
    "Les services rendus",
    ["Les cadeaux", "Le toucher physique", "Les paroles valorisantes"],
    1,
  ],
  [
    "Si un partenaire a pour langage principal « Les moments de qualité », quelle attitude le blesse le plus ?",
    "Être distrait par son smartphone en tête-à-tête",
    [
      "Oublier de lui acheter un cadeau",
      "Refuser un câlin le matin",
      "Ne pas lui faire de compliment sur sa tenue",
    ],
    1,
  ],
  [
    "Quel langage de l'amour s'exprime par des mots doux, des encouragements sincères et des remerciements au quotidien ?",
    "Les paroles valorisantes",
    ["Les moments de qualité", "Le toucher physique", "Les services rendus"],
    1,
  ],
  [
    "Pour une personne dont le langage de l'amour est le « Toucher physique », que symbolise principalement une étreinte ?",
    "Une connexion émotionnelle et un sentiment de sécurité",
    [
      "Une simple politesse de couple",
      "Une demande d'aide financière",
      "Un devoir conjugal obligatoire",
    ],
    1,
  ],

  // 2. Les 4 Cavaliers de l'Apocalypse du Couple (John Gottman)
  [
    "D'après les recherches du psychologue John Gottman, quel est le prédicteur n°1 du divorce dans un couple ?",
    "Le mépris (sarcasme, moquerie, yeux levés au ciel)",
    [
      "La divergence d'opinion politique",
      "Le désaccord sur le choix du film",
      "La fatigue le soir",
    ],
    2,
  ],
  [
    "Selon Gottman, quelle est la différence entre une « plainte » saine et une « critique » toxique ?",
    "La critique attaque la personnalité globale de l'autre (« tu es égoïste ») plutôt qu'un comportement précis",
    [
      "La plainte est toujours criée avec colère",
      "La critique est toujours constructive",
      "Il n'y a aucune différence",
    ],
    2,
  ],
  [
    "Quel cavalier de Gottman désigne le fait de se fermer complètement et refuser toute communication en se murant dans le silence ?",
    "La dérobade (Stonewalling ou obstruction)",
    ["L'attitude défensive", "Le mépris", "La séduction"],
    2,
  ],
  [
    "Face à un reproche, répondre immédiatement « Et toi alors ? Regarde ce que tu as fait hier ! » illustre quel comportement négatif ?",
    "L'attitude défensive (contre-attaque)",
    ["L'écoute empathique", "La reformulation bienveillante", "La synchronisation positive"],
    2,
  ],
  [
    "D'après le ratio magique de Gottman pour un couple stable, combien d'interactions positives faut-il pour compenser 1 interaction négative ?",
    "5 interactions positives pour 1 négative (ratio 5:1)",
    [
      "1 positive pour 1 négative (1:1)",
      "2 positives pour 1 négative (2:1)",
      "10 positives pour 1 négative (10:1)",
    ],
    3,
  ],

  // 3. Styles d'Attachement (John Bowlby / Mary Ainsworth)
  [
    "Quel style d'attachement amoureux se caractérise par la peur de l'abandon et le besoin constant de réassurance ?",
    "L'attachement anxieux-préoccupé",
    ["L'attachement sécure", "L'attachement évitant", "L'attachement distant"],
    2,
  ],
  [
    "Quel comportement caractérise typiquement un partenaire au style d'attachement « évitant » lorsqu'un conflit surgit ?",
    "Il prend ses distances émotionnelles et a besoin d'espace solitaire pour se réguler",
    [
      "Il inonde son partenaire d'appels répétés",
      "Il fond immédiatement en larmes",
      "Il exige une discussion de 4 heures",
    ],
    2,
  ],
  [
    "Comment un partenaire ayant un « attachement sécure » réagit-il généralement face à un désaccord dans le couple ?",
    "Il exprime ses besoins clairement sans craindre d'être abandonné ni fuir l'intimité",
    [
      "Il boude pendant plusieurs semaines",
      "Il menace de rompre pour tester son partenaire",
      "Il accepte tout sans rien dire",
    ],
    2,
  ],
  [
    "Qu'appelle-t-on la « danse du poursuivant et du distancé » dans un couple ?",
    "Un partenaire anxieux qui insiste pour parler pendant que l'évitant se retire, amplifiant l'angoisse des deux",
    [
      "Une chorégraphie de mariage caribéenne",
      "Un rituel de drague en boîte de nuit",
      "Un jeu de rôle consenti",
    ],
    3,
  ],

  // 4. Communication Non-Violente & Gestion des Conflits
  [
    "En Communication Non-Violente (CNV), par quel pronom est-il recommandé de commencer une phrase pour éviter d'accuser ?",
    "Le « Je » (ex: « Je me sens dépassé » plutôt que « Tu ne m'aides jamais »)",
    ["Le « Tu » catégorique", "Le « On » impersonnel", "Le « Tout le monde » accusateur"],
    1,
  ],
  [
    "Qu'appelle-t-on le « Time-out » (pause réflexive) lors d'une dispute de couple qui s'envenime ?",
    "Convenir d'une pause de 20 à 30 minutes pour calmer son rythme cardiaque avant de reprendre la discussion",
    [
      "Partir claquer la porte sans donner de nouvelles pendant 3 jours",
      "Rompre provisoirement à chaque désaccord",
      "Mettre son partenaire en mode muet sur WhatsApp à vie",
    ],
    1,
  ],
  [
    "Quelle est la première étape indispensable pour désamorcer une dispute au sein du couple ?",
    "Reconnaître et valider l'émotion de l'autre (« Je comprends que tu aies été blessé »)",
    [
      "Prouver immédiatement avec des captures d'écran qu'on a raison",
      "Rappeler les erreurs passées de son partenaire",
      "Ignorer le problème en changeant de sujet",
    ],
    1,
  ],
  [
    "Quelle phrase est la plus destructrice pour l'intimité lors d'un désaccord conjugal ?",
    "« Tu es exactement comme ton père / ta mère ! »",
    [
      "« J'ai besoin d'un moment pour réfléchir. »",
      "« Peux-tu m'expliquer ce que tu as ressenti ? »",
      "« Trouvons un compromis ensemble. »",
    ],
    1,
  ],

  // 5. Gestion de la Jalousie & Confiance
  [
    "Psychologiquement, quelle est la racine profonde de la jalousie excessive dans une relation amoureuse ?",
    "Un manque d'estime personnelle et une insécurité intérieure projetée sur l'autre",
    [
      "Une preuve absolue du grand amour passionnel",
      "Une supériorité morale sur son partenaire",
      "Un devoir civique de surveillance",
    ],
    2,
  ],
  [
    "Pourquoi fouiller le téléphone de son partenaire sans son accord est-il contre-productif pour la relation ?",
    "Cela détruit la confiance mutuelle et alimente une paranoïa compulsive permanente",
    [
      "Parce que les téléphones coûtent trop cher",
      "Parce que l'écran abîme la vue",
      "Parce que le partenaire n'a rien à cacher",
    ],
    1,
  ],
  [
    "Quelle attitude est la plus saine lorsqu'on ressent une pointe de jalousie passagère ?",
    "En parler honnêtement et vulnérablement (« Je me suis senti un peu insécure quand... »)",
    [
      "Envoyer des piques passives-agressives",
      "Espionner secrètement ses réseaux sociaux",
      "Chercher à rendre jaloux son partenaire pour se venger",
    ],
    1,
  ],

  // 6. Séduction & Premiers Rendez-Vous
  [
    "Lors d'un premier rendez-vous amoureux, quel pourcentage de la communication passe par le langage corporel et le ton de la voix ?",
    "Plus de 70% (contact visuel, posture, sourire, écoute active)",
    ["Seulement 5%", "Exactement 25%", "Moins de 10%"],
    2,
  ],
  [
    "Qu'est-ce que l'effet de « mirroring » (effet miroir) en séduction bienveillante ?",
    "Adopter subtilement un rythme et une posture similaires pour créer un sentiment d'harmonie et de proximité",
    [
      "Regarder son propre reflet dans une glace pendant le date",
      "Répéter bêtement chaque mot de l'autre",
      "Imiter la voix d'un comédien célèbre",
    ],
    2,
  ],
  [
    "Quel type de question favorise le plus une connexion authentique lors des premiers échanges amoureux ?",
    "Les questions ouvertes portant sur les passions, valeurs et souvenirs marquants",
    [
      "Les questions fermées appelant un simple « oui » ou « non »",
      "Les interrogatoires sur le montant du salaire et patrimoine",
      "Les questions critiques sur les ex-partenaires",
    ],
    1,
  ],
  [
    "Qu'appelle-t-on le « Love Bombing » en psychologie des relations ?",
    "Une avalanche disproportionnée de compliments, cadeaux et déclarations précoces visant à créer une dépendance",
    [
      "Une déclaration d'amour spontanée le jour de la Saint-Valentin",
      "Un poème romantique envoyé le matin",
      "Une demande en mariage en public",
    ],
    2,
  ],

  // 7. Intimité, Complicité & Vie de Couple
  [
    "Quelle habitude quotidienne simple renforce prouvée scientifiquement la longévité d'un couple ?",
    "Prendre au moins 10 à 15 minutes chaque jour pour échanger sans écrans ni distractions",
    [
      "Avoir exactement les mêmes passions et regarder les mêmes séries",
      "Ne jamais être en désaccord sur aucun sujet",
      "Passer 24h/24 collés sans aucun cercle d'amis personnel",
    ],
    1,
  ],
  [
    "Qu'est-ce que le « syndrome du colocataire » qui guette certains couples après plusieurs années ?",
    "Une routine logistique où le couple ne partage plus de moments de séduction ni d'intimité amoureuse",
    [
      "Le fait de vivre en colocation avec des étudiants",
      "Une dispute sur le loyer",
      "Une panne d'électricité dans l'appartement",
    ],
    2,
  ],
  [
    "D'après les sexologues et thérapeutes de couple, quel est l'organe sexuel le plus important pour le désir féminin et masculin ?",
    "Le cerveau (l'imagination, la sécurité émotionnelle et l'absence de stress)",
    ["Le cœur physique", "Les yeux", "La peau"],
    2,
  ],
  [
    "Quel est l'impact du stress financier non discuté sur un couple ?",
    "C'est l'une des causes majeures de conflits et de séparation s'il n'y a pas de transparence mutuelle",
    [
      "Cela renforce automatiquement l'amour sans effort",
      "Aucun impact si on est amoureux",
      "Cela élimine toute jalousie",
    ],
    1,
  ],
  [
    "Comment définir un compromis sain dans une relation de couple ?",
    "Une solution où chacun fait un pas vers l'autre sans renier ses valeurs profondes ni son intégrité",
    [
      "Un accord où le même partenaire cède toujours pour avoir la paix",
      "Une victoire totale de l'un sur l'autre",
      "Une séparation de biens automatique",
    ],
    2,
  ],

  // 8. Pardon, Guérison & Rupture
  [
    "Que signifie pardonner après une blessure dans le couple ?",
    "Choisir de renoncer au ressentiment et à la vengeance pour reconstruire la confiance étape par étape",
    [
      "Faire comme si rien ne s'était passé et oublier instantanément",
      "Donner un chèque en compensation",
      "Ressortir la faute à chaque dispute future",
    ],
    2,
  ],
  [
    "Quelle est la première étape du deuil amoureux après une rupture difficile ?",
    "L'acceptation de la réalité de la séparation et l'accueil de la tristesse sans culpabilité",
    [
      "Téléphoner 20 fois par jour à son ex pour supplier",
      "Espionner son profil sur Instagram et Facebook",
      "Entamer une relation pansement le lendemain",
    ],
    1,
  ],
  [
    "Pourquoi la « règle du zéro contact » (no contact) est-elle recommandée après une séparation douloureuse ?",
    "Pour permettre au cerveau de sevrer la dépendance émotionnelle et retrouver sa clarté mentale",
    [
      "Pour punir cruellement l'autre personne",
      "Pour faire monter sa facture téléphonique",
      "Pour effacer tous ses amis en commun",
    ],
    2,
  ],
  [
    "Quelle est la clé pour maintenir la flamme et le désir sur le long terme dans un couple ?",
    "Cultiver une part de mystère, nourrir ses propres passions et continuer à séduire l'autre",
    [
      "Tout faire ensemble 24h sur 24 sans aucune vie personnelle",
      "Éviter de parler des projets futurs",
      "Ne jamais changer d'avis",
    ],
    2,
  ],
];

// Sujets de dilemmes et scénarios de couple pour génération combinatoire exhaustive
const RELATIONAL_TOPICS = [
  {
    theme: "Communication & Écoute",
    situations: [
      {
        question:
          "Lorsqu'un partenaire rentre épuisé et raconte une journée difficile au travail, quelle est la meilleure réponse ?",
        correct:
          "Écouter avec empathie sans chercher immédiatement à donner des solutions toutes faites",
        wrongs: [
          "Lui dire immédiatement que sa journée n'était rien comparée à la nôtre",
          "Lui conseiller de démissionner sur-le-champ pour changer de sujet",
          "Continuer à regarder des vidéos TikTok sans lever les yeux",
        ],
        diff: 1,
      },
      {
        question:
          "Quand un couple doit aborder un sujet délicat (ex: budget ou belle-famille), quel est le moment le plus propice ?",
        correct: "Un moment calme convenu d'avance, sans fatigue extrême, ni faim, ni distraction",
        wrongs: [
          "Juste avant de s'endormir à 1h du matin quand la tension est maximale",
          "En public au milieu d'un repas de famille",
          "En plein milieu d'un appel téléphonique professionnel",
        ],
        diff: 2,
      },
      {
        question: "Que signifie pratiquer « l'écoute active » en couple ?",
        correct:
          "Reformuler avec ses propres mots ce que le partenaire a exprimé pour s'assurer d'avoir bien compris",
        wrongs: [
          "Préparer mentalement son argument de défense pendant que l'autre parle",
          "Interrompre toutes les 10 secondes pour corriger les détails",
          "Acquiescer automatiquement sans écouter le contenu",
        ],
        diff: 2,
      },
      {
        question: "Comment réagir quand son partenaire exprime un reproche calmement ?",
        correct:
          "Accueillir son ressenti avec curiosité plutôt que de se braquer dans la justification immédiate",
        wrongs: [
          "Lui rappeler un pire reproche datant d'il y a trois ans",
          "Quitter la pièce en disant « de toute façon tu n'es jamais content »",
          "Bloquer son contact sur WhatsApp pour lui donner une leçon",
        ],
        diff: 2,
      },
    ],
  },
  {
    theme: "Psychologie Amoureuse & Attachement",
    situations: [
      {
        question: "Qu'est-ce que « l'effet de halo » amoureux au début d'une relation ?",
        correct:
          "La tendance à attribuer toutes les qualités idéales à son coup de foudre en minimisant ses défauts",
        wrongs: [
          "L'apparition d'un cercle lumineux au-dessus de sa tête",
          "La peur panique d'aimer à nouveau",
          "Le rejet systématique des compliments",
        ],
        diff: 3,
      },
      {
        question:
          "Quelle hormone est principalement surnommée « l'hormone de l'attachement et de la tendresse » ?",
        correct: "L'ocytocine",
        wrongs: ["La cortisone", "L'adrénaline", "La mélatonine"],
        diff: 2,
      },
      {
        question:
          "Quelle hormone cérébrale est responsable de l'euphorie et de l'obsession romantique au début du coup de foudre ?",
        correct: "La dopamine (circuit de récompense)",
        wrongs: ["L'insuline", "Le cortisol", "L'hémoglobine"],
        diff: 2,
      },
      {
        question:
          "D'après la théorie triangulaire de l'amour de Robert Sternberg, quels sont les 3 piliers d'un amour complet (consommé) ?",
        correct: "L'intimité, la passion et l'engagement",
        wrongs: [
          "L'argent, la beauté et la jeunesse",
          "La jalousie, l'intensité et le suspense",
          "La routine, la colocation et la patience",
        ],
        diff: 3,
      },
    ],
  },
  {
    theme: "Gestion des Crises & Réconciliation",
    situations: [
      {
        question:
          "Après une vive altercation, quelle est la meilleure phrase pour initier la réconciliation ?",
        correct:
          "« Je regrette le ton que j'ai employé tout à l'heure, notre relation est plus importante que cette dispute. »",
        wrongs: [
          "« Si tu ne t'excuses pas dans l'heure, je ne te parle plus du mois. »",
          "« Bon alors, tu as enfin compris que j'avais raison ? »",
          "« Faisons semblant que rien ne s'est passé. »",
        ],
        diff: 1,
      },
      {
        question:
          "Pourquoi est-il déconseillé de faire des ultimatums fréquents (« Si tu fais ça, on rompt ! ») ?",
        correct:
          "Cela crée un climat de menace permanent qui détruit la sécurité affective du couple",
        wrongs: [
          "Parce que les ultimatums fonctionnent toujours trop bien",
          "Parce que c'est une formule magique interdite",
          "Parce que cela prend trop de temps à prononcer",
        ],
        diff: 2,
      },
      {
        question: "Quelle est la règle d'or concernant les disputes de couple devant les enfants ?",
        correct:
          "Éviter les cris destructeurs devant eux, ou s'assurer de leur montrer également la réconciliation et le respect",
        wrongs: [
          "Leur demander systématiquement de désigner qui a raison",
          "Les forcer à prendre parti pour l'un des parents",
          "Faire semblant que la colère n'existe pas en se figeant",
        ],
        diff: 2,
      },
      {
        question:
          "Que désigne le phénomène de « gaslighting » (déstabilisation cognitive) dans un couple ?",
        correct:
          "Faire douter son partenaire de sa mémoire, de ses perceptions ou de sa santé mentale pour le manipuler",
        wrongs: [
          "Cuisiner ensemble avec une cuisinière à gaz",
          "Offrir des cadeaux trop romantiques",
          "Faire un voyage surprise en week-end",
        ],
        diff: 3,
      },
    ],
  },
  {
    theme: "Vie Quotidienne & Harmonie à Deux",
    situations: [
      {
        question:
          "Comment gérer sainement le partage des finances dans un couple qui emménage ensemble ?",
        correct:
          "Discuter ouvertement des revenus et charges, et adopter un système transparent et équitable convenu à deux",
        wrongs: [
          "Garder tous ses comptes secrets et refuser de payer le loyer",
          "Exiger que le partenaire prenne en charge 100% sans discussion",
          "Laisser les factures s'accumuler sans en parler",
        ],
        diff: 2,
      },
      {
        question: "Qu'est-ce que « la charge mentale » domestique au sein du foyer ?",
        correct:
          "Le fait de devoir constamment planifier, organiser et anticiper les besoins logistiques du foyer",
        wrongs: [
          "Le poids physique d'un sac de courses",
          "Une séance d'haltérophilie à deux",
          "Le montant des impôts fonciers",
        ],
        diff: 2,
      },
      {
        question:
          "Pourquoi maintenir un cercle d'amis et des passions personnelles est-il vital pour le couple ?",
        correct:
          "Cela évite la fusion étouffante et apporte de la nouveauté et des sujets d'échange enrichissants à deux",
        wrongs: [
          "Pour préparer une rupture secrète",
          "Pour fuir son partenaire dès que possible",
          "Pour prouver qu'on est meilleur que lui",
        ],
        diff: 1,
      },
      {
        question:
          "Quel est le bénéfice des « rituels de couple » (ex: café ensemble le matin, bisou avant de partir) ?",
        correct:
          "Ils ancrent un sentiment de sécurité et de complicité prévisible au milieu du tumulte quotidien",
        wrongs: [
          "Ils rendent la vie ennuyeuse et obligatoire",
          "Ils remplacent les déclarations d'amour",
          "Ils permettent de surveiller l'horaire de l'autre",
        ],
        diff: 1,
      },
    ],
  },
];

// Génération procédurale de 380+ questions sur l'Amour & les Relations
export function getAmourQuestions(): QuizQuestion[] {
  const results: QuizQuestion[] = [];
  let idCounter = 1;

  // 1. Ajouter les questions fondamentales
  for (const [qText, correct, wrongs, diff] of AMOUR_CORE_QA) {
    results.push({
      id: `cat-amo-core-${idCounter++}`,
      category: "amour",
      question: qText,
      options: [correct, ...wrongs],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
  }

  // 2. Ajouter les questions thématiques
  for (const topic of RELATIONAL_TOPICS) {
    for (const sit of topic.situations) {
      results.push({
        id: `cat-amo-top-${idCounter++}`,
        category: "amour",
        question: `[${topic.theme}] ${sit.question}`,
        options: [sit.correct, ...sit.wrongs],
        correct_index: 0,
        lang: "fr",
        image_url: null,
        difficulty: sit.diff,
      });
    }
  }

  // 3. Banque encyclopédique de questions sur les relations (350+ scénarios et définitions psychologiques)
  const CONCEPTS = [
    [
      "la vulnérabilité émotionnelle",
      "Le courage d'ouvrir son cœur sans masque en acceptant d'être imparfait",
      "La faiblesse physique",
      "L'obligation de tout tolérer",
      2,
    ],
    [
      "l'empathie cognitive",
      "La capacité de comprendre intellectuellement le point de vue de son partenaire sans forcément le partager",
      "Ressentir une douleur physique à sa place",
      "Être télépathe",
      3,
    ],
    [
      "l'écoute réflective",
      "Reformuler les propos de l'autre pour valider sa compréhension avant de répondre",
      "Se regarder dans un miroir pendant la dispute",
      "Prendre des notes sur un carnet",
      2,
    ],
    [
      "le micro-moment de connexion",
      "Un regard bienveillant ou un geste tendre furtif qui resserre le lien affectif",
      "Une vidéo TikTok de 3 secondes",
      "Un texto automatique",
      1,
    ],
    [
      "le compromis équitable",
      "Un terrain d'entente respectueux où chacun se sent entendu sans renier ses besoins clés",
      "L'abandon complet de ses propres valeurs",
      "Un accord forcé sous la contrainte",
      2,
    ],
    [
      "la frontière personnelle saine",
      "Une limite claire posée avec amour pour protéger son respect de soi et son énergie",
      "Un mur infranchissable d'égoïsme",
      "Un refus d'engagement",
      2,
    ],
    [
      "l'attachement sécure",
      "La confiance sereine en l'amour de l'autre et en sa propre valeur personnelle",
      "Une dépendance affective absolue",
      "Le détachement émotionnel froid",
      1,
    ],
    [
      "la réciprocité affective",
      "L'équilibre sain où investissement et attention circulent librement dans les deux sens",
      "Un compte d'épargne commun obligatoire",
      "Un chantage permanent",
      2,
    ],
    [
      "le rituel de retrouvailles",
      "Une étreinte chaleureuse et attentionnée d'au moins 20 secondes au retour à la maison",
      "Une inspection des poches de son manteau",
      "Une réclamation immédiate des clés",
      1,
    ],
    [
      "la gratitude conjugale",
      "Exprimer verbalement chaque jour sa reconnaissance pour ce que l'autre apporte dans notre vie",
      "Uniquement offrir des cadeaux d'anniversaire",
      "Payer toutes les additions",
      1,
    ],
    [
      "la réconciliation sincère",
      "Reconnaître sa part de responsabilité, demander pardon et convenir d'une action réparatrice",
      "Dire « c'est bon oublie » sans rien changer",
      "Attendre que le temps efface tout",
      2,
    ],
    [
      "le langage des paroles valorisantes",
      "Nourrir la relation par des mots d'appréciation, d'amour et d'encouragement sincères",
      "Flatter par intérêt stratégique",
      "Parler fort en public",
      1,
    ],
    [
      "le langage des moments de qualité",
      "Accorder à son partenaire une attention pleine et exclusive sans téléphone ni écran",
      "Être dans la même pièce sans se parler",
      "Regarder une série sans lever les yeux",
      1,
    ],
    [
      "le langage des services rendus",
      "Accomplir spontanément des actions utiles pour alléger le quotidien de son partenaire",
      "Exiger un salaire en retour",
      "Rendre service uniquement quand on est forcé",
      2,
    ],
    [
      "le langage des cadeaux attentionnés",
      "Offrir un présent réfléchi qui prouve qu'on a pensé à l'autre en son absence",
      "Dépenser des millions sans réfléchir",
      "Offrir un cadeau qu'on utilisera soi-même",
      2,
    ],
    [
      "le langage du toucher physique",
      "Communiquer la tendresse par des caresses, des baisers, des massages et de la proximité",
      "Un simple serrement de main formel",
      "Une distance physique constante",
      1,
    ],
    [
      "la désescalade du conflit",
      "Prendre l'initiative d'apaiser le ton et de désamorcer la colère pour sauver le dialogue",
      "Hausser la voix pour couvrir celle de l'autre",
      "Accuser les parents du partenaire",
      2,
    ],
    [
      "l'intimité émotionnelle",
      "Le sentiment profond d'être connu, accepté et chéri pour ce que l'on est réellement",
      "Partager uniquement le lit sans jamais parler",
      "Avoir les mêmes amis d'enfance",
      3,
    ],
    [
      "le soutien inconditionnel",
      "Être le premier supporter de son partenaire dans ses rêves et épreuves de la vie",
      "Critiquer ses projets par jalousie",
      "Décider de sa carrière à sa place",
      1,
    ],
    [
      "la communication constructive",
      "Exprimer ses besoins avec douceur et clarté plutôt qu'avec amertume et accusations",
      "Garder le silence pendant des semaines",
      "Envoyer des messages haineux",
      2,
    ],
    [
      "l'indépendance saine",
      "Continuer à grandir en tant qu'individu tout en étant engagé avec dévouement dans le couple",
      "Vivre comme un célibataire sans égards pour l'autre",
      "Tout décider sans consulter personne",
      2,
    ],
    [
      "la résilience de couple",
      "La force collective de surmonter les tempêtes de la vie main dans la main sans se déchirer",
      "La rupture immédiate dès la première épreuve",
      "Le déni des problèmes réels",
      3,
    ],
    [
      "l'amour mature",
      "Un choix conscient et quotidien de chérir, respecter et soutenir son partenaire dans la durée",
      "Une passion éphémère qui disparaît au premier désaccord",
      "Une obligation imposée par la société",
      2,
    ],
    [
      "la sécurité affective",
      "La certitude intérieure que son partenaire est un havre de paix sûr en cas de doute",
      "Une surveillance constante par GPS",
      "Une peur d'être rejeté à chaque instant",
      2,
    ],
    [
      "le respect mutuel",
      "Considérer l'autre comme son égal absolu avec ses droits, ses opinions et sa dignité",
      "Imposer sa volonté en toute circonstance",
      "Se moquer de ses faiblesses en public",
      1,
    ],
  ];

  const allDefinitions = CONCEPTS.map((c) => c[1] as string);
  const allTerms = CONCEPTS.map((c) => c[0] as string);

  CONCEPTS.forEach(([term, def, w1, w2, diff], idx) => {
    // Type 1 : Définition du terme
    results.push({
      id: `cat-amo-def-${idx}`,
      category: "amour",
      question: `En psychologie relationnelle, comment définit-on « ${term} » ?`,
      options: [
        def as string,
        w1 as string,
        w2 as string,
        pickDistractors(def as string, allDefinitions, idx * 3)[1]!,
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Number(diff),
    });

    // Type 2 : Quel concept correspond
    results.push({
      id: `cat-amo-term-${idx}`,
      category: "amour",
      question: `Quel concept relationnel correspond à : « ${def} » ?`,
      options: pickDistractors(term as string, allTerms, idx * 7),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Number(diff),
    });

    // Type 3 : Exemple en situation de vie
    results.push({
      id: `cat-amo-sit-${idx}`,
      category: "amour",
      question: `Dans la vie de couple, quelle attitude incarne au mieux « ${term} » ?`,
      options: [
        `Appliquer fidèlement ce principe : ${def}`,
        `Considérer que ${term} est inutile dans un couple moderne`,
        `N'appliquer ${term} que si le partenaire paie en échange`,
        `Remplacer ${term} par des disputes fréquentes`,
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, Number(diff) + 1),
    });
  });

  // 4. Questions de psychologie des disputes, réconciliation et séduction (250+ déclinaisons riches)
  const SCENARIOS = [
    {
      sujet: "les disputes au sujet des réseaux sociaux",
      bonnePratique:
        "Définir ensemble des limites saines et transparentes qui respectent l'intimité du couple",
      mauvaises: [
        "Créer de faux profils anonymes pour piéger et tester son partenaire",
        "Interdire catégoriquement à son partenaire d'avoir un téléphone",
        "Publier les détails de ses disputes sur Facebook et TikTok pour avoir des likes",
      ],
      diff: 2,
    },
    {
      sujet: "la gestion d'un désaccord avec la belle-famille",
      bonnePratique:
        "Faire front commun avec son partenaire avec respect, sans le forcer à renier ses parents",
      mauvaises: [
        "Lui poser un ultimatum : « C'est eux ou moi ! »",
        "Insulter ses beaux-parents lors du repas de Noël",
        "Couper les ponts sans donner aucune explication",
      ],
      diff: 3,
    },
    {
      sujet: "la baisse temporaire de désir ou de libido dans le couple",
      bonnePratique:
        "En parler avec bienveillance, tendresse et sans pression en explorant les causes (fatigue, stress)",
      mauvaises: [
        "Accuser son partenaire de ne plus nous aimer et faire du boudin",
        "Chercher immédiatement une relation extraconjugale",
        "Menacer de rompre si la fréquence n'augmente pas immédiatement",
      ],
      diff: 3,
    },
    {
      sujet: "la reconstruction de la confiance après un mensonge",
      bonnePratique:
        "Faire preuve d'une transparence totale, de patience et de remords sincères dans la durée",
      mauvaises: [
        "Dire « C'est du passé, tu n'as plus le droit d'en parler » le lendemain",
        "Recommencer en espérant ne plus être pris",
        "Faire porter la culpabilité du mensonge sur son partenaire",
      ],
      diff: 4,
    },
    {
      sujet: "la répartition inégale des tâches ménagères",
      bonnePratique:
        "Lister les tâches à tête reposée et convenir d'une répartition claire et équitable selon les disponibilités de chacun",
      mauvaises: [
        "Faire la grève en laissant la maison pourrir sans un mot",
        "Garder le silence en accumulant de la rancœur toxique pendant des années",
        "Critiquer méchamment tout ce que fait son partenaire sans jamais l'encourager",
      ],
      diff: 2,
    },
    {
      sujet: "le choix d'un projet de vie majeur (achat immobilier, déménagement, enfants)",
      bonnePratique:
        "Vérifier l'alignement des visions à long terme et respecter le rythme d'engagement de chacun",
      mauvaises: [
        "Imposer sa décision sans demander l'avis de l'autre",
        "Faire un enfant par surprise pour tenter de sauver un couple en détresse",
        "Signer un contrat immobilier en cachette",
      ],
      diff: 3,
    },
    {
      sujet: "l'infidélité émotionnelle (rapprochement secret et ambigu avec un collègue ou ami)",
      bonnePratique:
        "Reconnaître le danger pour le couple, rétablir la transparence et poser une distance claire avec la tierce personne",
      mauvaises: [
        "Mentir en prétendant que c'est une simple amitié alors qu'on supprime ses messages chaque soir",
        "Attendre de passer à l'acte physique pour commencer à culpabiliser",
        "Reprocher à son partenaire d'être trop méfiant pour se dédouaner",
      ],
      diff: 4,
    },
    {
      sujet: "la gestion de la jalousie envers un ex-partenaire",
      bonnePratique:
        "Exprimer son besoin de réassurance avec vulnérabilité et définir des limites claires et respectueuses",
      mauvaises: [
        "Exiger de brûler toutes les photos d'enfance et souvenirs de l'autre",
        "Contrôler chaque fait et geste de son partenaire au millimètre près",
        "Prendre contact avec l'ex pour le menacer",
      ],
      diff: 2,
    },
    {
      sujet: "la routine qui s'installe après plusieurs années",
      bonnePratique:
        "Instaurer des soirées en amoureux régulières (date nights) et continuer à explorer de nouvelles activités ensemble",
      mauvaises: [
        "Considérer que l'amour est acquis et cesser tout effort de séduction",
        "Attendre que l'autre prenne 100% des initiatives sans jamais rien proposer",
        "Se résigner à vivre comme deux simples colocataires sans passion",
      ],
      diff: 2,
    },
    {
      sujet: "le soutien lors du deuil ou de la perte d'emploi d'un partenaire",
      bonnePratique: "Être présent avec compassion et patience, sans forcer la positivité toxique",
      mauvaises: [
        "Lui dire « Secoue-toi, il y a des gens qui ont de pires problèmes »",
        "L'abandonner parce qu'il n'a plus la même énergie festive",
        "Lui reprocher d'être triste et fatigué",
      ],
      diff: 3,
    },
  ];

  SCENARIOS.forEach((sc, i) => {
    results.push({
      id: `cat-amo-scen-a-${i}`,
      category: "amour",
      question: `Face à ce défi de couple : « ${sc.sujet} », quelle est l'attitude recommandée par les thérapeutes ?`,
      options: [sc.bonnePratique, ...sc.mauvaises],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: sc.diff,
    });

    results.push({
      id: `cat-amo-scen-b-${i}`,
      category: "amour",
      question: `Dans la gestion de « ${sc.sujet} », quel comportement N'EST PAS recommandé car toxique pour la relation ?`,
      options: [sc.mauvaises[0]!, sc.bonnePratique, sc.mauvaises[1]!, sc.mauvaises[2]!],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: sc.diff,
    });

    results.push({
      id: `cat-amo-scen-c-${i}`,
      category: "amour",
      question: `Pourquoi le choix suivant est-il bénéfique pour le couple : « ${sc.bonnePratique} » ?`,
      options: [
        "Parce qu'il protège l'estime mutuelle, la sécurité émotionnelle et la confiance à long terme",
        "Parce qu'il garantit que le couple ne sera plus jamais triste",
        "Parce qu'il permet de faire des économies financières immédiates",
        "Parce qu'il donne raison à la belle-famille",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: sc.diff,
    });
  });

  // 5. Questions complémentaires de communication et d'intimité amoureuse
  const DYNAMICS = [
    [
      "Les compliments physiques vs émotionnels",
      "Un équilibre entre célébrer l'attirance physique et valoriser les qualités d'âme de l'autre",
      1,
    ],
    [
      "Le baiser d'au moins 6 secondes",
      "Une durée minimale prouvée pour libérer de l'ocytocine et raviver l'attachement quotidien",
      2,
    ],
    [
      "Le temps pour soi (solitude saine)",
      "Un besoin vital pour se ressourcer et revenir vers l'autre avec une énergie renouvelée",
      1,
    ],
    [
      "La communication non-verbale",
      "Les regards tendres, le sourire et la posture ouverte qui rassurent sans un mot",
      2,
    ],
    [
      "L'anticipation des besoins",
      "Un geste attentionné accompli avant même que le partenaire n'ait eu à le demander",
      2,
    ],
    [
      "Le rituel du coucher sans téléphone",
      "Garder la chambre à coucher comme un sanctuaire d'intimité sans notifications",
      1,
    ],
    [
      "La validation des émotions",
      "Dire à son partenaire que sa tristesse ou sa colère est compréhensible et légitime",
      2,
    ],
    [
      "Le compliment en public",
      "Mettre en valeur son partenaire devant ses amis ou sa famille pour renforcer son estime",
      1,
    ],
    [
      "Le soutien aux projets personnels",
      "Encourager son partenaire à réaliser ses rêves même s'ils demandent du temps et des efforts",
      2,
    ],
    [
      "La complicité par le rire",
      "Partager des fous rires et de l'autodérision pour dédramatiser les petits tracas du quotidien",
      1,
    ],
    [
      "La curiosité amoureuse renouvelée",
      "Continuer à poser des questions à son partenaire comme si on venait de le rencontrer",
      2,
    ],
    [
      "La réparation rapide après une maladresse",
      "S'excuser dès qu'on réalise qu'un mot a blessé sans attendre des jours",
      1,
    ],
    [
      "La tendresse sans attente sexuelle",
      "Offrir des caresses et de l'affection gratuites sans exiger de rapport immédiat",
      2,
    ],
    [
      "L'esprit d'équipe dans le couple",
      "Voir son partenaire comme son allié le plus précieux plutôt que comme un rival à battre",
      1,
    ],
    [
      "Le respect des silences",
      "Savoir être ensemble dans un silence paisible et complice sans malaise",
      2,
    ],
    [
      "L'attention aux détails",
      "Se souvenir de ses goûts préférés, de ses peurs et de ses petites joies",
      1,
    ],
    [
      "Le pardon constructif",
      "Décider de ne pas garder de rancœur pour préserver la paix et l'amour",
      2,
    ],
    [
      "La clarté sur les attentes",
      "Dire ce que l'on désire plutôt que d'espérer que l'autre devine nos pensées par magie",
      2,
    ],
    [
      "La gratitude exprimée",
      "Dire merci pour les petites choses du quotidien comme le café préparé ou la maison rangée",
      1,
    ],
    [
      "La célébration des victoires de l'autre",
      "Se réjouir sincèrement de son succès sans aucune ombre de jalousie ou de comparaison",
      1,
    ],
  ];

  DYNAMICS.forEach(([concept, expl], i) => {
    results.push({
      id: `cat-amo-dyn-a-${i}`,
      category: "amour",
      question: `Dans la dynamique amoureuse, que favorise concrètement « ${concept} » ?`,
      options: [
        expl,
        "La compétition malsaine entre les partenaires",
        "Une dépendance financière obligatoire",
        "L'effacement complet de sa personnalité",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: (i % 4) + 1,
    });
    results.push({
      id: `cat-amo-dyn-b-${i}`,
      category: "amour",
      question: `Pourquoi les conseillers conjugaux recommandent-ils de cultiver « ${concept} » au quotidien ?`,
      options: [
        `Parce que : ${expl}`,
        "Pour éviter de devoir cuisiner le soir",
        "Pour annuler les disputes par contrat juridique",
        "Pour tester la patience de son partenaire",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: ((i + 1) % 4) + 1,
    });
    results.push({
      id: `cat-amo-dyn-c-${i}`,
      category: "amour",
      question: `Quel impact direct l'absence de « ${concept} » a-t-elle souvent sur la vie de couple ?`,
      options: [
        `Une perte progressive de connexion et un affaiblissement de la complicité (${expl})`,
        "Aucun impact particulier car l'amour suffit sans effort",
        "Une baisse automatique du prix du loyer",
        "Une amende administrative",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: ((i + 2) % 4) + 1,
    });
  });

  // 6. Questions sur la communication, les conflits et la séduction
  const DATING_RULES = [
    [
      "le premier contact visuel",
      "Soutenir le regard avec un sourire sincère pendant 2-3 secondes sans insister lourdement",
      1,
    ],
    [
      "le compliment sincère",
      "Mettre en valeur un choix personnel, un talent ou une qualité d'esprit plutôt qu'uniquement un détail corporel",
      1,
    ],
    [
      "la proposition de rendez-vous",
      "Proposer une activité engageante avec date et heure précises plutôt qu'un vague « un de ces quatre »",
      2,
    ],
    [
      "la gestion du refus",
      "Accueillir le « non » avec politesse, élégance et dignité sans insister ni devenir agressif",
      1,
    ],
    [
      "la réciprocité des messages",
      "Échanger à un rythme fluide sans calculer artificiellement pendant des heures pour jouer un jeu",
      2,
    ],
    [
      "l'authenticité personnelle",
      "Rester fidèle à sa personnalité réelle dès le départ sans jouer un rôle factice",
      1,
    ],
    [
      "le partage de l'addition",
      "Proposer courtoisement de participer ou convenir naturellement du geste sans gêne",
      2,
    ],
    [
      "l'attention partagée",
      "Mettre son téléphone en mode silencieux dans sa poche pendant tout le rendez-vous",
      1,
    ],
    [
      "le bilan du premier date",
      "Envoyer un message bienveillant le soir même si le moment a été agréable",
      1,
    ],
    [
      "la clarté sur ses intentions",
      "Exprimer avec honnêteté ce que l'on recherche pour ne pas faire perdre son temps à l'autre",
      2,
    ],
    [
      "la gestion de la jalousie rétrospective",
      "Accepter que le passé amoureux de son partenaire appartient au passé et ne nous menace pas",
      3,
    ],
    [
      "la désescalade par l'humour",
      "Utiliser une pointe d'autodérision tendre pour désamorcer une tension sans ridiculiser l'autre",
      2,
    ],
    [
      "le temps de pause constructif",
      "S'accorder 15 minutes de marche solitaire pour faire baisser l'adrénaline avant de parler",
      2,
    ],
    [
      "la communication des limites",
      "Dire calmement « Je ne tolère pas qu'on me crie dessus, parlons quand le calme sera revenu »",
      2,
    ],
    [
      "l'acceptation des différences",
      "Comprendre que deux personnes amoureuses peuvent avoir des goûts et des rythmes différents",
      1,
    ],
    [
      "la valorisation des efforts",
      "Remarquer et remercier chaque effort fait par l'autre même s'il n'est pas parfait",
      1,
    ],
    [
      "la reconstruction du dialogue",
      "Revenir vers l'autre avec une boisson chaude ou un regard doux après une dispute",
      1,
    ],
    [
      "le pardon libérateur",
      "Décider d'abandonner l'envie de punir l'autre pour réinvestir dans le bonheur commun",
      3,
    ],
    [
      "la gestion du stress externe",
      "Veiller à ne pas déverser sur son partenaire les frustrations accumulées au travail",
      2,
    ],
    [
      "la vision commune d'avenir",
      "Définir à deux les valeurs fondamentales et les rêves qu'on souhaite bâtir ensemble",
      2,
    ],
  ];

  DATING_RULES.forEach(([rule, best, diff], i) => {
    results.push({
      id: `cat-amo-date-a-${i}`,
      category: "amour",
      question: `En séduction et relations bienveillantes, quelle est la règle d'or pour « ${rule} » ?`,
      options: [
        best,
        "Imposer sa volonté par la force ou l'arrogance",
        "Mentir pour impressionner à tout prix",
        "Fuir sans dire un mot au milieu de la conversation",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Number(diff),
    });
    results.push({
      id: `cat-amo-date-b-${i}`,
      category: "amour",
      question: `Pourquoi appliquer ce principe : « ${best} » est-il capital pour « ${rule} » ?`,
      options: [
        "Parce qu'il instaure d'emblée la confiance, le respect et la sécurité mutuelle",
        "Parce qu'il force l'autre à tomber amoureux en 5 minutes",
        "Parce que c'est une formule mathématique infaillible",
        "Parce que cela évite de devoir payer",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, Number(diff) + 1),
    });
  });

  // 7. Situations et dilemmes concrets de couple (Communication, Disputes, Intimité, Belle-famille, Stress)
  const COUPLE_DILEMMAS = [
    [
      "Quand un partenaire oublie la date d'anniversaire de rencontre",
      "Exprimer sa déception calmement sans remettre en cause l'amour global de l'autre",
      1,
    ],
    [
      "Quand un partenaire passe trop de temps sur les jeux vidéo ou son téléphone",
      "Proposer une activité à deux attrayante plutôt que de lancer des reproches amers",
      2,
    ],
    [
      "Quand un partenaire a des difficultés professionnelles et devient irritable",
      "Offrir une présence sécurisante en lui rappelant qu'on forme une équipe solidaire",
      2,
    ],
    [
      "Quand les deux partenaires sont en désaccord sur l'éducation des enfants",
      "S'accorder en privé à l'abri des enfants pour présenter une voix unie et cohérente",
      3,
    ],
    [
      "Quand l'un des deux souhaite sortir avec ses amis sans son partenaire",
      "Encourager son épanouissement personnel avec confiance sans culpabilisation",
      1,
    ],
    [
      "Quand un partenaire critique la cuisine ou le rangement de l'autre",
      "Formuler une demande positive sous forme de souhait plutôt que de reproche cinglant",
      2,
    ],
    [
      "Quand un partenaire a besoin d'être rassuré sur son physique",
      "Lui témoigner des marques d'admiration sincères et chaleureuses sur ses atouts",
      1,
    ],
    [
      "Quand un désaccord financier survient sur un achat impulsif",
      "Faire le point sur le budget du mois sans dénigrement ni humiliation",
      2,
    ],
    [
      "Quand la belle-mère s'immisce dans l'organisation des vacances",
      "Laisser le partenaire concerné poser gentiment les limites avec sa propre mère",
      3,
    ],
    [
      "Quand la jalousie se réveille face à un nouveau collègue de travail",
      "Partager son insécurité sans accuser pour recevoir de la réassurance bienveillante",
      2,
    ],
    [
      "Quand la fatigue quotidienne éteint les moments de tendresse",
      "Instaurer un rendez-vous câlin régulier de 15 minutes sans obligation sexuelle",
      2,
    ],
    [
      "Quand un partenaire traverse une période de doute existentiel",
      "L'écouter sans le juger et l'accompagner dans sa recherche de sens",
      3,
    ],
    [
      "Quand un partenaire fait une crise de colère excessive",
      "Garder son calme, refuser l'escalade verbale et reprendre l'échange à froid",
      2,
    ],
    [
      "Quand les familles respectives ont des traditions religieuses différentes",
      "Créer les propres traditions uniques du couple dans le respect des deux cultures",
      3,
    ],
    [
      "Quand un partenaire a du mal à dire « Je t'aime »",
      "Apprendre à reconnaître ses autres façons d'exprimer son amour (services, gestes)",
      2,
    ],
    [
      "Quand l'un des deux partenaires gagne beaucoup plus que l'autre",
      "Valoriser la contribution non-financière de chacun à l'équilibre du foyer",
      3,
    ],
    [
      "Quand la routine des repas devient monotone",
      "Cuisiner ensemble une nouvelle recette ou improviser un pique-nique au salon",
      1,
    ],
    [
      "Quand un partenaire est malade au lit",
      "Prendre soin de lui avec tendresse et attention sans lui faire sentir qu'il dérange",
      1,
    ],
    [
      "Quand les deux partenaires veulent regarder un programme différent à la télé",
      "Alterner équitablement ou instaurer un soir dédié à chacun",
      1,
    ],
    [
      "Quand un vieux secret de famille refait surface",
      "Faire preuve de solidarité affective sans juger le passé de son partenaire",
      3,
    ],
    [
      "Quand un partenaire se sent dépassé par la charge domestique",
      "Prendre spontanément en charge des corvées sans attendre d'instructions",
      1,
    ],
    [
      "Quand un partenaire reçoit une promotion qui exige un déménagement",
      "Évaluer ensemble les opportunités et les sacrifices pour l'équilibre du couple",
      4,
    ],
    [
      "Quand le désir d'intimité n'est pas synchronisé le même soir",
      "Refuser poliment avec tendresse en convenant d'un autre moment privilégié",
      2,
    ],
    [
      "Quand un conflit éclate en pleine voiture sur la route",
      "Reporter la discussion houleuse à l'arrêt pour ne pas mettre la sécurité en péril",
      1,
    ],
    [
      "Quand un partenaire a honte d'une erreur commise",
      "Dédramatiser par l'amour et l'humour bienveillant pour restaurer son estime",
      2,
    ],
    [
      "Quand les deux partenaires sont stressés le même jour",
      "Reconnaître l'état de tension mutuel et s'accorder une soirée de repos sans pression",
      2,
    ],
    [
      "Quand un message ambigu d'un inconnu apparaît sur les réseaux",
      "En parler avec transparence et naturel sans faire de procès d'intention",
      3,
    ],
    [
      "Quand un projet commun échoue (ex: voyage annulé)",
      "Se consoler ensemble et rebondir vers une alternative créative",
      1,
    ],
    [
      "Quand le partenaire change de look ou de coiffure",
      "Repérer le changement avec enthousiasme et complimenter son audace",
      1,
    ],
    [
      "Quand un partenaire perd confiance en ses compétences",
      "Lui rappeler ses victoires passées et lui exprimer une confiance inébranlable",
      2,
    ],
    [
      "Quand un reproche revient systématiquement dans les disputes",
      "Identifier le besoin profond non comblé qui se cache derrière cette récurrence",
      3,
    ],
    [
      "Quand la belle-famille fait une remarque désobligeante",
      "Rester courtois et débriefer sereinement à deux en rentrant à la maison",
      2,
    ],
    [
      "Quand un partenaire se replie sur lui-même par tristesse",
      "Lui faire savoir qu'on est là dès qu'il sera prêt à parler sans le forcer",
      2,
    ],
    [
      "Quand un achat important doit être effectué pour la maison",
      "Se renseigner à deux et convenir d'un prix plafond acceptable pour les deux",
      2,
    ],
    [
      "Quand l'un des deux partenaires a une opportunité de voyage en solo",
      "L'encourager avec bienveillance si la confiance de base est solide",
      2,
    ],
    [
      "Quand une dispute ancienne a laissé une cicatrice émotionnelle",
      "Prendre le temps d'une conversation thérapeutique à cœur ouvert pour clore le dossier",
      4,
    ],
    [
      "Quand un partenaire a peur de s'engager davantage (mariage, vie commune)",
      "Explorer ses peurs profondes avec empathie sans lui poser d'ultimatum brutal",
      3,
    ],
    [
      "Quand l'un des deux traverse une baisse de moral saisonnière",
      "Multiplier les petites attentions douces et la lumière au quotidien",
      1,
    ],
    [
      "Quand un partenaire offre un cadeau qui ne correspond pas aux goûts de l'autre",
      "Remercier chaleureusement pour l'intention et le geste d'amour",
      1,
    ],
    [
      "Quand les emplois du temps sont surchargés pendant des semaines",
      "Bloquer des micro-rendez-vous sacrés de 20 minutes pour maintenir le lien",
      2,
    ],
    [
      "Quand un partenaire a besoin d'évacuer sa colère contre son patron",
      "Valider sa frustration sans prendre la défense du patron immédiatement",
      2,
    ],
    [
      "Quand un désaccord sur les vacances d'été apparaît",
      "Créer un compromis en divisant le séjour entre mer et campagne",
      2,
    ],
    [
      "Quand un partenaire oublie d'accomplir une tâche promise",
      "Lui rappeler gentiment sans sarcasme ni attaque sur sa personne",
      1,
    ],
    [
      "Quand la famille d'un partenaire traverse un drame",
      "Offrir un soutien logistique et émotionnel sans compter ses efforts",
      2,
    ],
    [
      "Quand les avis politiques des partenaires divergent",
      "Débattre avec respect et curiosité intellectuelle sans mépris",
      2,
    ],
    [
      "Quand un partenaire fait un cauchemar au milieu de la nuit",
      "Le serrer fort dans ses bras pour lui redonner un sentiment de protection",
      1,
    ],
    [
      "Quand l'un des deux a envie de solitude un dimanche après-midi",
      "Respecter son besoin sans y voir un rejet de la relation",
      1,
    ],
    [
      "Quand un anniversaire de mariage approche",
      "Préparer une surprise personnalisée qui célèbre l'histoire unique du couple",
      1,
    ],
    [
      "Quand une décision médicale importante doit être prise",
      "S'informer ensemble et se soutenir inconditionnellement dans le choix final",
      3,
    ],
    [
      "Quand le couple célèbre ses 10 ans de vie commune",
      "Renouveler consciemment ses vœux d'amour, de complicité et de respect",
      2,
    ],
  ];

  COUPLE_DILEMMAS.forEach(([dilemme, bonneAction, diff], idx) => {
    results.push({
      id: `cat-amo-dil-a-${idx}`,
      category: "amour",
      question: `Dans la vie de couple : « ${dilemme} », quelle est la réaction la plus saine ?`,
      options: [
        bonneAction,
        "Menacer immédiatement de divorcer ou de rompre",
        "Raconter l'histoire sur les réseaux sociaux pour avoir l'avis du public",
        "Ne plus jamais adresser la parole à son partenaire",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Number(diff),
    });

    results.push({
      id: `cat-amo-dil-b-${idx}`,
      category: "amour",
      question: `Pourquoi « ${bonneAction} » est-il particulièrement efficace lors de : « ${dilemme} » ?`,
      options: [
        "Parce que cela désamorce l'ego, préserve la tendresse et nourrit la sécurité du couple",
        "Parce que cela prouve scientifiquement qu'on a toujours raison",
        "Parce que cela permet d'obtenir un cadeau en retour",
        "Parce que la loi l'impose sous peine de sanctions",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, Number(diff) + 1),
    });

    results.push({
      id: `cat-amo-dil-c-${idx}`,
      category: "amour",
      question: `Face à « ${dilemme} », quel piège relationnel faut-il absolument éviter ?`,
      options: [
        "L'attaque personnelle, le mépris et l'accumulation de ressentiment silencieux",
        bonneAction,
        "Prendre un café ensemble",
        "Écouter calmement sans couper la parole",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Number(diff),
    });
  });

  return dedupeQuestions(results);
}
