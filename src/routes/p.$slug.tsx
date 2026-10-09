import { createFileRoute } from "@tanstack/react-router";
import { CustomPage } from "@/components/CustomPage";

export const Route = createFileRoute("/p/$slug")({
  head: () => ({
    meta: [
      { title: "QuizBoss — Page spéciale" },
      { name: "description", content: "Contenu spécial et nouveautés QuizBoss." },
      { property: "og:title", content: "QuizBoss — Page spéciale" },
      { property: "og:description", content: "Découvre les nouveautés QuizBoss." },
    ],
  }),
  component: DynamicPage,
});

function DynamicPage() {
  const { slug } = Route.useParams();
  return <CustomPage slug={slug} />;
}
