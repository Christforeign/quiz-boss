import { createFileRoute } from "@tanstack/react-router";
import { CustomPage } from "@/components/CustomPage";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — QuizBoss" },
      { name: "description", content: "Règles d'utilisation de QuizBoss, des pièces et des retraits." },
      { property: "og:title", content: "Conditions d'utilisation — QuizBoss" },
      { property: "og:description", content: "Les règles du jeu QuizBoss." },
    ],
  }),
  component: () => <CustomPage slug="conditions" />,
});
