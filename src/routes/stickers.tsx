import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/stickers")({
  head: () => ({
    meta: [
      { title: "Packs de stickers WhatsApp — QuizBoss" },
      { name: "description", content: "Packs de stickers WhatsApp par thème : humour, réactions, amour… Télécharge ou partage en un clic." },
      { property: "og:title", content: "Packs de stickers WhatsApp — QuizBoss" },
      { property: "og:description", content: "Humour, réactions, amour : les meilleurs stickers à partager." },
    ],
  }),
  component: StickersPage,
});

async function fetchFiles(urls: string[], name: string) {
  return Promise.all(
    urls.map(async (u, i) => {
      const blob = await (await fetch(u)).blob();
      const ext = blob.type.includes("webp") ? "webp" : "png";
      return new File([blob], `${name}-${i + 1}.${ext}`, { type: blob.type });
    }),
  );
}

function StickersPage() {
  const [cat, setCat] = useState("Tout");
  const [busy, setBusy] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["sticker-packs"],
    queryFn: async () =>
      (await supabase.from("sticker_packs").select("id,name,category,stickers(id,image_url)").order("created_at", { ascending: false })).data ?? [],
  });
  const packs = data ?? [];
  const cats = ["Tout", ...Array.from(new Set(packs.map((p) => p.category)))];
  const shown = packs.filter((p) => cat === "Tout" || p.category === cat);

  const downloadPack = async (p: (typeof packs)[number]) => {
    setBusy(p.id);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const files = await fetchFiles(p.stickers.map((s) => s.image_url), p.name);
      files.forEach((f) => zip.file(f.name, f));
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = `${p.name}.zip`; a.click();
      URL.revokeObjectURL(a.href);
    } catch { toast.error("Téléchargement impossible"); }
    setBusy(null);
  };

  const addToWhatsApp = async (p: (typeof packs)[number]) => {
    setBusy(p.id);
    try {
      const files = await fetchFiles(p.stickers.map((s) => s.image_url), p.name);
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files, title: p.name });
        toast("Dans WhatsApp, appuie sur un sticker reçu puis « Ajouter aux favoris » ⭐");
      } else {
        await downloadPack(p);
        toast("Ouvre les images avec une app de stickers pour les ajouter à WhatsApp.");
      }
    } catch { /* user cancelled */ }
    setBusy(null);
  };

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-3xl font-extrabold">Packs de stickers</h1>
        <p className="text-sm text-muted-foreground">Les meilleurs stickers WhatsApp, classés par thème.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${cat === c ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>{c}</button>
        ))}
      </div>
      {shown.length === 0 && <p className="py-10 text-center text-muted-foreground">Aucun pack pour l'instant. Reviens bientôt !</p>}
      {shown.map((p, i) => (
        <section key={p.id} style={{ animationDelay: `${i * 50}ms` }} className="rounded-3xl bg-card p-4 animate-pop">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-extrabold">{p.name}</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{p.category}</span>
            <span className="ml-auto text-xs text-muted-foreground">{p.stickers.length} stickers</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {p.stickers.map((s) => (
              <div key={s.id} className="aspect-square rounded-xl bg-muted/50 p-1.5">
                <img src={s.image_url} alt="" loading="lazy" className="h-full w-full object-contain" />
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button disabled={busy === p.id || !p.stickers.length} className="bg-success text-primary-foreground hover:bg-success/90" onClick={() => addToWhatsApp(p)}>
              <Send /> Ajouter à WhatsApp
            </Button>
            <Button variant="secondary" disabled={busy === p.id || !p.stickers.length} onClick={() => downloadPack(p)}>
              <Download /> Télécharger
            </Button>
          </div>
        </section>
      ))}
    </div>
  );
}
