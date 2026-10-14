# Plan de Mise à Jour Majeure : Catégorie « Amour & Relations », 365+ Questions par Catégorie, Anti-Répétition FIFO & Duel Synchronisé

Ce plan détaille l'implémentation de la mise à jour majeure de QuizBoss sans impacter le stockage existant, en respectant TanStack Start, Tailwind v4 et Lovable Cloud.

---

## 1. Nouvelle Catégorie « Amour & Relations » & Catalogue 365+ Questions
- **Dans `src/lib/categories.ts`** :
  - Ajouter l'entrée `{ id: "amour", label: "Amour & Relations", emoji: "❤️", grad: "bg-grad-candy", color: "#F43F5E" }`.
  - Intégrer les thématiques : séduction, disputes & réconciliation, communication de couple, intimité, psychologie amoureuse, gestion de la jalousie et du stress affectif.
- **Dans `src/lib/infiniteQuizCatalog.ts` & `src/lib/hardQuestions.ts`** :
  - Étendre la base procédurale et encyclopédique pour garantir **au minimum 365 questions uniques et authentiques pour CHACUNE des 12 catégories** :
    1. *Amour & Relations* (365+ questions structurées)
    2. *Géographie & Monde* (365+)
    3. *Musique & TikTok* (365+)
    4. *Cinéma & Séries* (365+)
    5. *Culture Générale* (365+)
    6. *Informatique & Tech* (365+)
    7. *Sport & Football* (365+)
    8. *Histoire & Haïti / Monde* (365+)
    9. *Sciences & Nature* (365+)
    10. *Logique & Maths* (365+)
    11. *Bible & Spiritualité* (365+)
    12. *Anglais & Langues* (365+)
    13. *Mix Aléatoire* (+ de 4 500 questions uniques combinées)
  - Génération 100% procédurale en TypeScript pur (instantanée, zéro dépendance IA payante, sans coût).
  - Échelonnage graduel de la difficulté (niveaux 1 à 4 : Facile, Moyen, Difficile, Expert).

---

## 2. Algorithme Anti-Répétition (Mémoire FIFO 150 Questions)
- **Dans `src/lib/infiniteQuizCatalog.ts`** :
  - Clé de stockage `quizboss_seen_questions_fifo`.
  - Mémorisation FIFO (First-In, First-Out) stricte limitée aux **150 dernières questions vues**.
  - Filtrage d'exclusion : les questions présentes dans cette file sont éliminées du tirage tant que la catégorie dispose d'assez de questions fraîches.
  - Garantie absolue : déduplication stricte par ID et libellé de question pour éviter tout doublon dans une même session de 10 questions.

---

## 3. Décompte Synchronisé 3-2-1 & Fiabilisation du Duel en Ligne
- **Dans `src/routes/duel.tsx`** :
  - **Écran de Décompte Synchronisé (3, 2, 1, Partez !)** : Dès que l'adversaire rejoint ou accepte, les deux joueurs affichent simultanément un compte à rebours visuel et sonore rythmé (3 → 2 → 1 → 🚀) avant l'affichage de la première question.
  - **Prise en charge du mode Tour par tour (15s)** en plus du mode réflexe rapide.
  - **Expiration et nettoyage** : Expiration à 60s pour les défis privés ciblés, 180s pour les salons publics, suppression immédiate du lobby dès qu'un match commence ou est annulé.
  - **Bouton rouge d'annulation et boutons du lobby** : Bouton rouge visible *« ✕ Annuler ma chambre »* pour restituer la mise et retirer la salle, boutons *Accepter* et *Décliner* immédiatement actionnables sans scroll.

---

## 4. Correction TypeScript & Vitest
- **Dans `src/lib/player.ts`** :
  - Corriger l'appel à `submitScore` dans `addCoins` où la variable `score` était non définie, afin que la compilation `npm run build` et `vitest` passent sans erreur TypeScript.
  - Sécuriser les effets audio pour éliminer tout risque de boucle de ré-éxécution React (*Maximum update depth exceeded*).

---

## 5. Préservation Responsive & Ergonomie
- Conserver la barre inférieure ergonomique (tabs existants confirmés : Jouer, Duel, Explorer, Statuts, Wallet) avec `pb-safe`.
- Maintenir le tiroir Drawer latéral (Sheet) avec accès rapide aux retraits, pages personnalisées, FAQ et conditions.
- Garder le widget Support et liens WhatsApp au-dessus de la barre sans chevaucher les actions de jeu.

---

## Vérification & Tests
1. **Compilation** : `compile_applet` pour vérifier qu'aucune erreur TypeScript ne persiste.
2. **Linter & Qualité** : validation via `lint_applet`.
3. **Comptage Catalogue** : script de vérification automatisé assurant que chaque catégorie dépasse bien le seuil des 365 questions uniques.
4. **Test Décompte & Duel** : vérification de l'animation 3-2-1 et du basculement en mode Tour par tour.
