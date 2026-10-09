export const CATEGORIES = [
  { id: "musique", label: "Musique & TikTok", emoji: "🎵", grad: "bg-grad-candy" },
  { id: "geographie", label: "Géographie", emoji: "🌍", grad: "bg-grad-ocean" },
  { id: "culture", label: "Culture générale", emoji: "🧠", grad: "bg-grad-lime" },
  { id: "cinema", label: "Cinéma & Séries", emoji: "🎬", grad: "bg-grad-sunset" },
  { id: "informatique", label: "Informatique & Tech", emoji: "💻", grad: "bg-grad-ocean" },
  { id: "mix", label: "Mix Aléatoire", emoji: "🎲", grad: "bg-grad-night" },
] as const;

export const THEMES = ["sunset", "ocean", "lime", "night", "candy"] as const;
export const themeClass = (t: string) => `bg-grad-${THEMES.includes(t as never) ? t : "sunset"}`;

export function shareWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}
