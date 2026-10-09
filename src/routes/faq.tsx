import { createFileRoute } from "@tanstack/react-router";
import { CustomPage } from "@/components/CustomPage";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — QuizBoss" },
      {
        name: "description",
        content: "Réponses aux questions fréquentes sur QuizBoss : pièces, niveaux, retraits.",
      },
      { property: "og:title", content: "FAQ — QuizBoss" },
      { property: "og:description", content: "Toutes les réponses sur QuizBoss." },
    ],
  }),
  component: () => <CustomPage slug="faq" />,
});
