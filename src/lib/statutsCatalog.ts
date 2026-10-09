export type StatutItem = {
  id: string;
  kind: "quote" | "motivation" | "sticker" | "proverbe" | "boss";
  content: string;
  author: string | null;
  emoji: string | null;
  theme: "sunset" | "ocean" | "lime" | "night" | "candy";
  created_at?: string;
};

/**
 * Grand catalogue intégré de Statuts WhatsApp, Citations, Motivations,
 * Proverbes Haïtiens (Kreyòl), Punchlines Boss et Stickers.
 */
export const BUILTIN_STATUTS: StatutItem[] = [
  // MOTIVATION & BOSS MINDSET
  {
    id: "st-cat-1",
    kind: "motivation",
    content: "Travay an silans, kite siksè ou fè bri pou ou.",
    author: "Mentalité Boss",
    emoji: "🔥",
    theme: "sunset",
  },
  {
    id: "st-cat-2",
    kind: "motivation",
    content: "Chaque matin est une nouvelle opportunité de bâtir la vie que tu mérites.",
    author: null,
    emoji: "☀️",
    theme: "lime",
  },
  {
    id: "st-cat-3",
    kind: "boss",
    content: "Ils doutent de toi aujourd'hui, demain ils demanderont comment tu as fait.",
    author: "QuizBoss",
    emoji: "👑",
    theme: "night",
  },
  {
    id: "st-cat-4",
    kind: "motivation",
    content: "La discipline te mènera là où la motivation seule ne suffit plus.",
    author: null,
    emoji: "⚡",
    theme: "ocean",
  },
  {
    id: "st-cat-5",
    kind: "boss",
    content: "Pas d'excuses, que des résultats. Mode Boss activé 24/7.",
    author: null,
    emoji: "💎",
    theme: "candy",
  },
  {
    id: "st-cat-6",
    kind: "motivation",
    content: "Ne baisse jamais les bras : le plus dur précède toujours la plus belle victoire.",
    author: null,
    emoji: "🏆",
    theme: "sunset",
  },
  {
    id: "st-cat-7",
    kind: "boss",
    content: "Ton cercle doit parler projets, investissements, paix et évolution.",
    author: "Visionnaire",
    emoji: "🚀",
    theme: "night",
  },
  {
    id: "st-cat-8",
    kind: "motivation",
    content: "Même si tu avances lentement, tu dépasses tous ceux qui restent assis.",
    author: null,
    emoji: "🎯",
    theme: "lime",
  },
  {
    id: "st-cat-9",
    kind: "boss",
    content: "Garde ton calme, garde ton focus, encaisse et progresse.",
    author: null,
    emoji: "🦁",
    theme: "ocean",
  },
  {
    id: "st-cat-10",
    kind: "motivation",
    content: "Ce que tu sèmes avec patience aujourd'hui fleurira avec abondance demain.",
    author: null,
    emoji: "🌱",
    theme: "lime",
  },
  {
    id: "st-cat-11",
    kind: "boss",
    content: "Moins de bavardages, plus d'actions. Les vrais gagnants construisent dans l'ombre.",
    author: null,
    emoji: "♟️",
    theme: "night",
  },
  {
    id: "st-cat-12",
    kind: "motivation",
    content: "Ta seule limite, c'est celle que tu acceptes dans ton esprit.",
    author: null,
    emoji: "🧠",
    theme: "candy",
  },

  // PROVERBES HAÏTIENS & SAGESSE KREYÒL
  {
    id: "st-ht-1",
    kind: "proverbe",
    content: "Piti piti zwazo fè nich li.",
    author: "Pwovèb Ayisyen",
    emoji: "🐦",
    theme: "ocean",
  },
  {
    id: "st-ht-2",
    kind: "proverbe",
    content: "Dèyè mòn gen mòn.",
    author: "Pwovèb Ayisyen",
    emoji: "⛰️",
    theme: "night",
  },
  {
    id: "st-ht-3",
    kind: "proverbe",
    content: "Men anpil, chay pa lou.",
    author: "Pwovèb Ayisyen",
    emoji: "🤝",
    theme: "sunset",
  },
  {
    id: "st-ht-4",
    kind: "proverbe",
    content: "Bèl dan pa di zanmi pou sa.",
    author: "Pwovèb Ayisyen",
    emoji: "🎭",
    theme: "candy",
  },
  {
    id: "st-ht-5",
    kind: "proverbe",
    content: "Tout bèt nan lanmè manje moun, se reken ki pote move non.",
    author: "Pwovèb Ayisyen",
    emoji: "🦈",
    theme: "ocean",
  },
  {
    id: "st-ht-6",
    kind: "proverbe",
    content: "Chita pa bay, se leve goumen ki bay.",
    author: "Sagesse Kreyòl",
    emoji: "💪",
    theme: "lime",
  },
  {
    id: "st-ht-7",
    kind: "proverbe",
    content: "Sak vid pa kanpe.",
    author: "Pwovèb Ayisyen",
    emoji: "🌾",
    theme: "sunset",
  },
  {
    id: "st-ht-8",
    kind: "proverbe",
    content: "Avoka Bondye pa janm pèdi pwosè.",
    author: "Pwovèb Ayisyen",
    emoji: "🙏",
    theme: "night",
  },
  {
    id: "st-ht-9",
    kind: "proverbe",
    content: "Jou malè, lèt kaye kase tèt ou.",
    author: "Pwovèb Ayisyen",
    emoji: "⚡",
    theme: "candy",
  },
  {
    id: "st-ht-10",
    kind: "proverbe",
    content: "Konn li pa di lespri pou sa.",
    author: "Pwovèb Ayisyen",
    emoji: "📚",
    theme: "ocean",
  },
  {
    id: "st-ht-11",
    kind: "proverbe",
    content: "Sa k ap kouri pa konn sa k ap vin dèyè.",
    author: "Pwovèb Ayisyen",
    emoji: "⏳",
    theme: "night",
  },
  {
    id: "st-ht-12",
    kind: "proverbe",
    content: "Solèy leve pou tout moun.",
    author: "Pwovèb Ayisyen",
    emoji: "🌅",
    theme: "sunset",
  },

  // CITATIONS CÉLÈBRES
  {
    id: "st-qt-1",
    kind: "quote",
    content:
      "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.",
    author: "Winston Churchill",
    emoji: "🔥",
    theme: "sunset",
  },
  {
    id: "st-qt-2",
    kind: "quote",
    content: "Cela semble toujours impossible jusqu'à ce qu'on le fasse.",
    author: "Nelson Mandela",
    emoji: "🌍",
    theme: "ocean",
  },
  {
    id: "st-qt-3",
    kind: "quote",
    content: "La meilleure façon de prédire l'avenir est de le créer.",
    author: "Peter Drucker",
    emoji: "🚀",
    theme: "night",
  },
  {
    id: "st-qt-4",
    kind: "quote",
    content:
      "Votre temps est limité, ne le gâchez pas en menant une existence qui n'est pas la vôtre.",
    author: "Steve Jobs",
    emoji: "💡",
    theme: "candy",
  },
  {
    id: "st-qt-5",
    kind: "quote",
    content:
      "L'éducation est l'arme la plus puissante qu'on puisse utiliser pour changer le monde.",
    author: "Nelson Mandela",
    emoji: "🎓",
    theme: "lime",
  },
  {
    id: "st-qt-6",
    kind: "quote",
    content: "Celui qui déplace une montagne commence par déplacer de petites pierres.",
    author: "Confucius",
    emoji: "⛰️",
    theme: "ocean",
  },
  {
    id: "st-qt-7",
    kind: "quote",
    content: "Ne juge pas chaque jour à la récolte que tu fais, mais aux graines que tu sèmes.",
    author: "Robert Louis Stevenson",
    emoji: "🌻",
    theme: "sunset",
  },
  {
    id: "st-qt-8",
    kind: "quote",
    content: "Dans la vie, on ne regrette que ce qu'on n'a pas osé tenter.",
    author: "Jean Cocteau",
    emoji: "✨",
    theme: "candy",
  },
  {
    id: "st-qt-9",
    kind: "quote",
    content: "L'imagination est plus importante que le savoir.",
    author: "Albert Einstein",
    emoji: "🌌",
    theme: "night",
  },
  {
    id: "st-qt-10",
    kind: "quote",
    content: "Un gagnant est un rêveur qui n'abandonne jamais.",
    author: "Nelson Mandela",
    emoji: "🥇",
    theme: "lime",
  },

  // STICKERS & STATUTS COURTS WHATSAPP
  {
    id: "st-stk-1",
    kind: "sticker",
    content: "Boss mode activé 😎",
    author: null,
    emoji: "😎",
    theme: "candy",
  },
  {
    id: "st-stk-2",
    kind: "sticker",
    content: "Pa janm bay legen 💪🇭🇹",
    author: null,
    emoji: "💪",
    theme: "lime",
  },
  {
    id: "st-stk-3",
    kind: "sticker",
    content: "Bonjou fanmi ! Bondye devan nan tout sa n ap fè 🙏✨",
    author: null,
    emoji: "🙏",
    theme: "sunset",
  },
  {
    id: "st-stk-4",
    kind: "sticker",
    content: "Bon nwit fanmi ❤️ Dòmi anpè",
    author: null,
    emoji: "🌙",
    theme: "night",
  },
  {
    id: "st-stk-5",
    kind: "sticker",
    content: "Focus sou objektif la 🎯💰",
    author: null,
    emoji: "🎯",
    theme: "ocean",
  },
  {
    id: "st-stk-6",
    kind: "sticker",
    content: "0% Stress · 100% Bénédictions ✨",
    author: null,
    emoji: "✨",
    theme: "lime",
  },
  {
    id: "st-stk-7",
    kind: "sticker",
    content: "Qui ose me défier en Duel aujourd'hui ? ⚔️🔥",
    author: null,
    emoji: "⚔️",
    theme: "candy",
  },
  {
    id: "st-stk-8",
    kind: "sticker",
    content: "L'union fait la force 🇭🇹🔥",
    author: null,
    emoji: "🇭🇹",
    theme: "ocean",
  },
  {
    id: "st-stk-9",
    kind: "sticker",
    content: "Nou pa nan pale anpil, n ap avanse 🚀",
    author: null,
    emoji: "🚀",
    theme: "night",
  },
  {
    id: "st-stk-10",
    kind: "sticker",
    content: "Bénie, reconnaissante et inarrêtable 👑💖",
    author: null,
    emoji: "👑",
    theme: "candy",
  },
  {
    id: "st-stk-11",
    kind: "sticker",
    content: "Bon week-end à tous les vrais ! 🎉🔥",
    author: null,
    emoji: "🎉",
    theme: "sunset",
  },
  {
    id: "st-stk-12",
    kind: "sticker",
    content: "Le respect se gagne, la loyauté se prouve 💯",
    author: null,
    emoji: "💯",
    theme: "night",
  },
];

export function mergeStatutsCatalog(dbRows: StatutItem[]): StatutItem[] {
  const seen = new Set<string>();
  const out: StatutItem[] = [];
  for (const r of [...dbRows, ...BUILTIN_STATUTS]) {
    const key = r.content.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}
