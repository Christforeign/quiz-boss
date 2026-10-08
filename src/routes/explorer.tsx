import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdSlot } from "@/components/Ads";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "Explorer — Jeux & outils partenaires | QuizBoss" },
      { name: "description", content: "Mini-jeux, outils et liens partenaires intégrés directement dans QuizBoss." },
      { property: "og:title", content: "Explorer — QuizBoss" },
      { property: "og:description", content: "Des jeux et outils partenaires à découvrir." },
    ],
  }),
  component: Explorer,
});

function Explorer() {
  const { data } = useQuery({
    queryKey: ["embeds"],
    queryFn: async () => (await supabase.from("embeds").select("*").order("created_at")).data ?? [],
  });
  const [open, setOpen] = useState<{ title: string; url: string } | null>(null);

  if (open)
    return (
      <div className="space-y-3 animate-pop">
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(null)} className="flex items-center gap-1 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Retour</button>
          <span className="ml-2 font-bold">{open.title}</span>
          <a href={open.url} target="_blank" rel="noreferrer" className="ml-auto text-muted-foreground"><ExternalLink className="h-4 w-4" /></a>
        </div>
        <iframe src={open.url} title={open.title} className="h-[70vh] w-full rounded-2xl border border-border bg-card" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        <p className="text-xs text-muted-foreground">Si le contenu ne s'affiche pas, le site partenaire bloque l'intégration : ouvre-le avec l'icône ↗.</p>
      </div>
    );

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-3xl font-extrabold">Explorer</h1>
        <p className="text-sm text-muted-foreground">Jeux, outils et partenaires à découvrir.</p>
      </div>
      <div className="grid gap-3">
        {(data ?? []).map((e, i) => (
          <button key={e.id} onClick={() => setOpen(e)} style={{ animationDelay: `${i * 50}ms` }}
            className="flex items-center gap-4 rounded-2xl bg-card p-4 text-left transition-transform animate-pop hover:-translate-y-0.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-grad-ocean text-xl font-extrabold text-secondary-foreground">{e.title[0]}</span>
            <div className="min-w-0">
              <p className="font-bold">{e.title}</p>
              <p className="truncate text-sm text-muted-foreground">{e.description}</p>
            </div>
          </button>
        ))}
      </div>
      <AdSlot slot="explorer" />
    </div>
  );
}
