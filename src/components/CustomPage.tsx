import { Hammer, Clock } from "lucide-react";
import { usePages } from "@/lib/site";

const DEFAULTS: Record<string, { title: string; body: string }> = {
  conditions: { title: "Conditions d'utilisation", body: "Les conditions d'utilisation seront publiées très bientôt." },
  faq: { title: "FAQ", body: "Les questions fréquentes arrivent bientôt." },
};

export function CustomPage({ slug }: { slug: string }) {
  const { data, isLoading } = usePages();
  if (isLoading) return <p className="py-16 text-center text-muted-foreground">Chargement…</p>;
  const page = data?.find((p) => p.slug === slug);
  const def = DEFAULTS[slug];
  const status = page?.status ?? (def ? "active" : "disabled");

  if (status === "disabled" || (!page && !def))
    return <p className="py-16 text-center text-muted-foreground">Cette page n'est pas disponible.</p>;

  if (status === "coming_soon" || status === "maintenance") {
    const soon = status === "coming_soon";
    return (
      <div className="mt-10 rounded-3xl bg-card p-8 text-center animate-pop">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${soon ? "bg-grad-lime" : "bg-grad-sunset"} text-primary-foreground`}>
          {soon ? <Clock className="h-8 w-8" /> : <Hammer className="h-8 w-8" />}
        </div>
        <h1 className="mt-4 text-2xl font-extrabold">{soon ? "Bientôt disponible" : "Maintenance en cours"}</h1>
        {page?.title && <p className="mt-1 text-muted-foreground">{page.title}</p>}
      </div>
    );
  }

  const title = page?.title || def?.title || "";
  if (page?.mode === "html")
    return (
      <div className="space-y-3 pb-6 animate-pop">
        {title && <h1 className="text-3xl font-extrabold">{title}</h1>}
        <iframe
          title={title}
          srcDoc={page.html ?? ""}
          sandbox="allow-scripts allow-popups allow-forms"
          className="h-[75vh] w-full rounded-2xl border border-border bg-background"
        />
      </div>
    );

  return (
    <article className="space-y-4 pb-6 animate-pop">
      {page?.image_url && <img src={page.image_url} alt="" className="w-full rounded-3xl object-cover" />}
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <div className="whitespace-pre-line leading-relaxed text-muted-foreground">{page?.body ?? def?.body}</div>
    </article>
  );
}
