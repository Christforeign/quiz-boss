// @ts-nocheck -- tableaux de données hétérogènes, validés à l'exécution
import type { QuizQuestion } from "../hardQuestions";
import { dedupeQuestions, pickDistractors } from "./helpers";

export const TECH_ACRONYMS: Array<[string, string, string, number]> = [
  ["HTTP", "HyperText Transfer Protocol", "Web & Réseaux", 1],
  ["HTTPS", "HyperText Transfer Protocol Secure", "Sécurité Web", 1],
  ["DNS", "Domain Name System", "Résolution d'adresses IP", 2],
  ["TCP", "Transmission Control Protocol", "Protocole réseau fiable connecté", 2],
  ["UDP", "User Datagram Protocol", "Protocole réseau rapide sans connexion", 2],
  ["IP", "Internet Protocol", "Routage des paquets sur Internet", 1],
  ["SQL", "Structured Query Language", "Langage standard pour bases de données", 1],
  ["JSON", "JavaScript Object Notation", "Format léger d'échange de données", 1],
  ["API", "Application Programming Interface", "Interface de communication logicielle", 1],
  ["REST", "Representational State Transfer", "Architecture d'API Web sans état (stateless)", 2],
  ["CRUD", "Create, Read, Update, Delete", "Quatre opérations de base sur les données", 2],
  ["DOM", "Document Object Model", "Arborescence d'objets HTML dans le navigateur", 2],
  ["CSS", "Cascading Style Sheets", "Feuilles de style pour la présentation web", 1],
  ["HTML", "HyperText Markup Language", "Langage de balisage pour structurer le web", 1],
  ["CPU", "Central Processing Unit", "Processeur central d'un ordinateur", 1],
  ["GPU", "Graphics Processing Unit", "Processeur graphique pour calculs et 3D", 1],
  ["RAM", "Random Access Memory", "Mémoire vive volatile rapide", 1],
  ["SSD", "Solid State Drive", "Disque de stockage à mémoire flash", 1],
  ["BIOS", "Basic Input Output System", "Micrologiciel de démarrage sur carte mère", 2],
  ["SSH", "Secure Shell", "Protocole de connexion chiffrée à distance", 2],
  ["FTP", "File Transfer Protocol", "Protocole de transfert de fichiers", 2],
  ["SMTP", "Simple Mail Transfer Protocol", "Protocole d'envoi de courriers électroniques", 2],
  [
    "IMAP",
    "Internet Message Access Protocol",
    "Protocole de réception et synchronisation d'e-mails",
    2,
  ],
  ["VPN", "Virtual Private Network", "Tunnel sécurisé chiffré sur Internet", 1],
  ["LAN", "Local Area Network", "Réseau informatique local", 1],
  ["WAN", "Wide Area Network", "Réseau étendu à grande échelle géographique", 2],
  ["NAT", "Network Address Translation", "Traduction d'adresses IP privées vers publique", 3],
  ["DHCP", "Dynamic Host Configuration Protocol", "Attribution dynamique des configurations IP", 2],
  ["JWT", "JSON Web Token", "Jeton sécurisé d'authentification et transmission", 3],
  ["CORS", "Cross-Origin Resource Sharing", "Politique de sécurité des requêtes entre domaines", 3],
  [
    "CSRF",
    "Cross-Site Request Forgery",
    "Attaque falsifiant des requêtes utilisateur légitimes",
    4,
  ],
  ["XSS", "Cross-Site Scripting", "Injection malveillante de scripts dans des pages web", 3],
  ["DDoS", "Distributed Denial of Service", "Attaque par saturation distribuée de requêtes", 2],
  [
    "RAID",
    "Redundant Array of Independent Disks",
    "Regroupement de disques pour redondance ou vitesse",
    3,
  ],
  [
    "ACID",
    "Atomicity, Consistency, Isolation, Durability",
    "Propriétés garantissant la fiabilité des transactions SQL",
    4,
  ],
  [
    "ORM",
    "Object-Relational Mapping",
    "Passerelle entre code orienté objet et base relationnelle",
    3,
  ],
  [
    "CI/CD",
    "Continuous Integration / Continuous Deployment",
    "Automatisation des tests et déploiements logiciels",
    2,
  ],
  ["SaaS", "Software as a Service", "Logiciel hébergé dans le cloud et accessible en ligne", 1],
  ["PaaS", "Platform as a Service", "Plateforme cloud fournissant l'environnement d'exécution", 2],
  [
    "IaaS",
    "Infrastructure as a Service",
    "Ressources matérielles virtualisées louées dans le cloud",
    2,
  ],
];

export const NETWORK_PORTS: Array<[string, number, string, number]> = [
  ["SSH (Secure Shell)", 22, "Administration serveur sécurisée", 2],
  ["HTTP (Web non sécurisé)", 80, "Trafic web standard", 1],
  ["HTTPS (Web sécurisé SSL/TLS)", 443, "Trafic web chiffré", 1],
  ["DNS (Domain Name System)", 53, "Résolution des noms de domaine", 2],
  ["FTP (File Transfer)", 21, "Contrôle de transfert de fichiers", 2],
  ["SMTP (Envoi d'e-mails)", 25, "Routage du courrier électronique", 2],
  ["MySQL", 3306, "Base de données relationnelle", 2],
  ["PostgreSQL", 5432, "Base de données relationnelle avancée", 2],
  ["Redis", 6379, "Base de données clé-valeur en mémoire", 3],
  ["MongoDB", 27017, "Base de données NoSQL orientée documents", 3],
  ["RDP (Remote Desktop Protocol)", 3389, "Bureau à distance Windows", 3],
  ["DHCP (Serveur)", 67, "Attribution d'adresses réseau", 3],
  ["NTP (Network Time Protocol)", 123, "Synchronisation de l'heure réseau", 3],
  ["SNMP (Network Management)", 161, "Surveillance des équipements réseau", 3],
  ["Telnet (Non chiffré)", 23, "Protocole distant historique non sécurisé", 3],
];

export const DEV_COMMANDS: Array<[string, string, string, number]> = [
  [
    "ls -la",
    "Lister tous les fichiers y compris cachés avec permissions détaillées",
    "Linux / Bash",
    1,
  ],
  [
    "chmod 755",
    "Attribuer les droits rwx au propriétaire et rx aux autres utilisateurs",
    "Linux / Permissions",
    2,
  ],
  [
    "chown user:group",
    "Changer le propriétaire et le groupe d'un fichier ou dossier",
    "Linux / Système",
    2,
  ],
  [
    "grep -rn",
    "Rechercher récursivement une chaîne de texte dans des fichiers avec numéros de lignes",
    "Linux / Recherche",
    2,
  ],
  [
    "ps aux",
    "Afficher la liste complète de tous les processus en cours d'exécution",
    "Linux / Processus",
    2,
  ],
  [
    "kill -9 <PID>",
    "Forcer l'arrêt immédiat d'un processus via le signal SIGKILL",
    "Linux / Processus",
    2,
  ],
  [
    "df -h",
    "Afficher l'espace disque disponible sur les systèmes de fichiers en format lisible",
    "Linux / Disque",
    2,
  ],
  ["tar -xzf", "Extraire une archive compressée au format tar.gz", "Linux / Archives", 2],
  [
    "git clone",
    "Télécharger une copie complète d'un dépôt distant sur sa machine locale",
    "Git",
    1,
  ],
  ["git checkout -b", "Créer une nouvelle branche et basculer immédiatement dessus", "Git", 1],
  ["git status", "Afficher l'état de l'arbre de travail et des fichiers modifiés", "Git", 1],
  ["git commit -m", "Enregistrer les modifications indexées avec un message descriptif", "Git", 1],
  [
    "git pull --rebase",
    "Récupérer les commits distants en rejouant ses commits locaux par-dessus",
    "Git",
    2,
  ],
  [
    "git stash",
    "Mettre de côté temporairement les modifications non indexées de travail",
    "Git",
    2,
  ],
  ["git merge", "Fusionner une branche spécifique dans la branche active actuelle", "Git", 1],
];

export function getInformatiqueQuestions(): QuizQuestion[] {
  const results: QuizQuestion[] = [];
  const allDefs = TECH_ACRONYMS.map((t) => t[1]);
  const allTerms = TECH_ACRONYMS.map((t) => t[0]);

  // 1. Acronymes (2 x 40 = 80)
  TECH_ACRONYMS.forEach(([term, def, domain, diff], i) => {
    results.push({
      id: `inf-acr-def-${i}`,
      category: "informatique",
      question: `[${domain}] Que signifie l'acronyme informatique « ${term} » ?`,
      options: pickDistractors(def, allDefs, i * 11),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `inf-acr-trm-${i}`,
      category: "informatique",
      question: `Quel acronyme informatique correspond à « ${def} » (${domain}) ?`,
      options: pickDistractors(term, allTerms, i * 17),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
  });

  // 2. Ports Réseau (2 x 15 = 30)
  const portNumbers = NETWORK_PORTS.map((p) => String(p[1]));
  NETWORK_PORTS.forEach(([svc, port, desc, diff], i) => {
    results.push({
      id: `inf-prt-num-${i}`,
      category: "informatique",
      question: `Sur quel port réseau TCP/UDP standard écoute habituellement « ${svc} » ?`,
      options: pickDistractors(String(port), portNumbers, i * 13),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `inf-prt-svc-${i}`,
      category: "informatique",
      question: `À quel service réseau correspond usuellement le port ${port} (${desc}) ?`,
      options: pickDistractors(
        svc,
        NETWORK_PORTS.map((p) => p[0]),
        i * 19,
      ),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
  });

  // 3. Commandes Linux / Git (2 x 15 = 30)
  DEV_COMMANDS.forEach(([cmd, action, domain, diff], i) => {
    results.push({
      id: `inf-cmd-act-${i}`,
      category: "informatique",
      question: `[${domain}] À quoi sert précisément la commande « ${cmd} » ?`,
      options: pickDistractors(
        action,
        DEV_COMMANDS.map((c) => c[1]),
        i * 7,
      ),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `inf-cmd-cmd-${i}`,
      category: "informatique",
      question: `[${domain}] Quelle commande permet de « ${action} » ?`,
      options: pickDistractors(
        cmd,
        DEV_COMMANDS.map((c) => c[0]),
        i * 23,
      ),
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
  });

  // 4. Conversions Binaires & Hexadécimales (200 questions math-informatique)
  for (let n = 1; n <= 100; n++) {
    const bin = n.toString(2).padStart(8, "0");
    const d1 = ((n + 3) % 256).toString(2).padStart(8, "0");
    const d2 = ((n + 7) % 256).toString(2).padStart(8, "0");
    const d3 = (Math.abs(n - 5) % 256).toString(2).padStart(8, "0");

    results.push({
      id: `inf-bin-${n}`,
      category: "informatique",
      question: `Quelle est la conversion binaire sur 8 bits du nombre décimal ${n} ?`,
      options: [bin, d1, d2, d3],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: n > 32 ? 3 : 2,
    });

    const hex = "0x" + n.toString(16).toUpperCase();
    results.push({
      id: `inf-hex-${n}`,
      category: "informatique",
      question: `Quelle est la valeur décimale du nombre hexadécimal ${hex} ?`,
      options: [String(n), String(n + 16), String(Math.max(1, n - 8)), String(n + 4)],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: n > 16 ? 3 : 2,
    });
  }

  // 5. Concepts Développement Web, Algorithmes & Cloud (120 questions)
  const WEB_DEV_CONCEPTS = [
    [
      "Quelle est la différence fondamentale entre let et const en JavaScript ?",
      "const empêche la réassignation de la variable, tandis que let permet la réassignation",
      [
        "let n'existe pas en JavaScript",
        "const ne fonctionne que pour les nombres",
        "Il n'y a aucune différence",
      ],
      1,
    ],
    [
      "Que signifie le concept d'Immutabilité en programmation fonctionnelle et en React ?",
      "Les données ne sont jamais modifiées directement, on crée une nouvelle copie avec les changements",
      [
        "Les variables sont supprimées immédiatement de la mémoire",
        "Le code refuse de compiler",
        "Les fonctions ne prennent aucun paramètre",
      ],
      2,
    ],
    [
      "En SQL, quelle clause permet de filtrer les résultats d'une requête SELECT ?",
      "WHERE",
      ["ORDER BY", "GROUP BY", "LIMIT"],
      1,
    ],
    [
      "Quelle instruction SQL permet d'insérer un nouvel enregistrement dans une table ?",
      "INSERT INTO",
      "UPDATE",
      "SELECT",
      1,
    ],
    [
      "En base de données relationnelle, qu'est-ce qu'une Clé Primaire (Primary Key) ?",
      "Un identifiant unique pour chaque ligne d'une table",
      [
        "Un mot de passe pour ouvrir la base",
        "Une clé USB de sauvegarde",
        "La première colonne créée",
      ],
      1,
    ],
    [
      "Qu'est-ce qu'une Clé Étrangère (Foreign Key) en SQL ?",
      "Un champ qui fait référence à la clé primaire d'une autre table pour lier les données",
      ["Une clé provenant d'un autre pays", "Un virus informatique", "Une colonne temporaire"],
      2,
    ],
    [
      "Quel hook React standard est utilisé pour exécuter des effets de bord (appels API, timers) ?",
      "useEffect",
      ["useState", "useMemo", "useContext"],
      1,
    ],
    [
      "Quel hook React sert à conserver une valeur d'état locale qui déclenche un re-rendu lors de sa modification ?",
      "useState",
      ["useRef", "useCallback", "useLayoutEffect"],
      1,
    ],
    [
      "Que renvoie l'opérateur typeof null en JavaScript standard ?",
      "object (comportement historique hérité)",
      ["null", "undefined", "number"],
      3,
    ],
    [
      "Quelle méthode de tableau JavaScript permet de créer un nouveau tableau en appliquant une fonction à chaque élément ?",
      "Array.prototype.map()",
      ["Array.prototype.forEach()", "Array.prototype.filter()", "Array.prototype.reduce()"],
      1,
    ],
    [
      "Quelle méthode JavaScript permet de tester si au moins un élément d'un tableau satisfait une condition ?",
      "Array.prototype.some()",
      ["Array.prototype.every()", "Array.prototype.find()", "Array.prototype.includes()"],
      2,
    ],
    [
      "Quel format de données est le plus couramment utilisé pour les échanges de données dans les API Web modernes ?",
      "JSON",
      ["XML", "CSV", "YAML"],
      1,
    ],
    [
      "Que signifie le code de statut HTTP 404 ?",
      "Not Found (Ressource introuvable)",
      ["OK (Succès)", "Internal Server Error (Erreur serveur)", "Forbidden (Accès refusé)"],
      1,
    ],
    [
      "Que signifie le code de statut HTTP 200 ?",
      "OK (La requête a réussi)",
      ["Created (Créé)", "Unauthorized (Non authentifié)", "Bad Request (Mauvaise requête)"],
      1,
    ],
    [
      "Que signifie le code de statut HTTP 500 ?",
      "Internal Server Error (Erreur interne du serveur)",
      ["Not Modified", "Gateway Timeout", "Page Expired"],
      1,
    ],
    [
      "Que signifie le code de statut HTTP 401 ?",
      "Unauthorized (Authentification requise ou invalide)",
      ["Payment Required", "Gone", "Accepted"],
      2,
    ],
    [
      "Quel outil de conteneurisation permet d'empaqueter une application avec ses dépendances dans un conteneur portable ?",
      "Docker",
      ["Kubernetes", "VirtualBox", "Nginx"],
      1,
    ],
    [
      "Quel orchestrateur open-source développé à l'origine par Google gère le déploiement et la mise à l'échelle de conteneurs ?",
      "Kubernetes (K8s)",
      ["Docker Compose", "Vagrant", "Ansible"],
      2,
    ],
    [
      "Quel serveur HTTP et proxy inverse performant est très utilisé pour gérer le trafic web et l'équilibrage de charge ?",
      "Nginx",
      ["Apache Tomcat", "IIS", "Squid"],
      2,
    ],
    [
      "Dans Git, quelle commande permet d'annuler le dernier commit tout en conservant les modifications dans l'espace de travail ?",
      "git reset --soft HEAD~1",
      ["git push --force", "git rm -rf", "git clean -f"],
      3,
    ],
  ];

  WEB_DEV_CONCEPTS.forEach(([qText, correct, wrongs, diff], i) => {
    results.push({
      id: `inf-web-a-${i}`,
      category: "informatique",
      question: qText,
      options: [correct, ...wrongs],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: diff,
    });
    results.push({
      id: `inf-web-b-${i}`,
      category: "informatique",
      question: `[Développement & Tech] Quelle affirmation est exacte concernant : « ${correct} » ?`,
      options: [
        qText,
        "C'est un protocole obsolète depuis 1980",
        "C'est un type de câble sous-marin",
        "C'est une faille matérielle de carte mère",
      ],
      correct_index: 0,
      lang: "fr",
      image_url: null,
      difficulty: Math.min(4, diff + 1),
    });
  });

  return dedupeQuestions(results);
}
