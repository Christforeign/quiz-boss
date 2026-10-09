import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Download, Share2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { shareWhatsApp, themeClass } from "@/lib/categories";
import { mergeStatutsCatalog, type StatutItem } from "@/lib/statutsCatalog";
import { sfx } from "@/lib/sound";
import { AdSlot } from "@/components/Ads";
import { toast } from "sonner";

export const Route = createFileRoute("/statuts")({
  head: () => ({
    meta: [
      { title: "Statuts & Motivation WhatsApp — QuizBoss" },
      {
        name: "description",
        content:
          "Citations, textes de motivation, proverbes créoles, punchlines Boss et stickers à partager en statut WhatsApp.",
      },
      { property: "og:title", content: "Statuts WhatsApp inspirants — QuizBoss" },
      {
        property: "og:description",
        content: "Télécharge et partage en 1 clic des visuels motivants.",
      },
    ],
  }),
  component: Statuts,
});

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "motivation", label: "Motivation ⚡" },
  { id: "proverbe", label: "Proverbes 🇭🇹" },
  { id: "boss", label: "Mentalité Boss 👑" },
  { id: "quote", label: "Citations 💬" },
  { id: "sticker", label: "Stickers 😎" },
];

const GRADS: Record<string, [string, string]> = {
  sunset: ["#ef5a3c", "#f2b33d"],
  ocean: ["#1f6fb5", "#3cc6c0"],
  lime: ["#b5f23d", "#3cd68a"],
  night: ["#1e2240", "#5a3a9a"],
  candy: ["#e24c8f", "#f39a4a"],
};

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

async function render(q: {
  content: string;
  author: string | null;
  emoji: string | null;
  theme: string;
}) {
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1920;
  const ctx = c.getContext("2d")!;
  const [a, b] = GRADS[q.theme] ?? (["#ef5a3c", "#f2b33d"] as [string, string]);
  const g = ctx.createLinearGradient(0, 0, 1080, 1920);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1080, 1920);
  const dark = q.theme === "lime";
  ctx.fillStyle = dark ? "#141a2e" : "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "180px serif";
  if (q.emoji) ctx.fillText(q.emoji, 540, 620);
  ctx.font = "bold 72px Manrope, sans-serif";
  const lines = wrap(ctx, q.content, 880);
  const start = 960 - (lines.length * 96) / 2 + 60;
  lines.forEach((l, i) => ctx.fillText(l, 540, start + i * 96));
  if (q.author) {
    ctx.font = "600 48px Manrope, sans-serif";
    ctx.fillText(`— ${q.author}`, 540, start + lines.length * 96 + 60);
  }
  ctx.font = "bold 40px Manrope, sans-serif";
  ctx.globalAlpha = 0.7;
  ctx.fillText("QuizBoss", 540, 1820);
  return new Promise<Blob>((res) => c.toBlob((bl) => res(bl!), "image/png"));
}

function Statuts() {
  const [filter, setFilter] = useState("all");
  const { data } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () =>
      (await supabase.from("quotes").select("*").order("created_at", { ascending: false })).data ??
      [],
  });
  const allStatuts = mergeStatutsCatalog((data ?? []) as StatutItem[]);
  const list = allStatuts.filter((q) => filter === "all" || q.kind === filter);

  const download = async (q: (typeof list)[number]) => {
    sfx.click();
    const blob = await render(q);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "statut-quizboss.png";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Image HD téléchargée !");
  };

  const copyText = (q: (typeof list)[number]) => {
    sfx.click();
    const text = `${q.emoji ?? ""} ${q.content}${q.author ? ` — ${q.author}` : ""}`.trim();
    navigator.clipboard.writeText(text);
    toast.success("Statut copié !");
  };

  const share = async (q: (typeof list)[number]) => {
    sfx.click();
    const text = `${q.emoji ?? ""} ${q.content}${q.author ? ` — ${q.author}` : ""}`;
    try {
      const blob = await render(q);
      const file = new File([blob], "statut.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }
    } catch {
      /* fall back to text share */
    }
    shareWhatsApp(text);
    toast("Astuce : télécharge l'image puis ajoute-la à ton statut 📲");
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Statuts & Motivation</h1>
          <p className="text-sm text-muted-foreground">
            Télécharge en image HD, copie le texte ou partage en 1 clic sur WhatsApp.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-extrabold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> {allStatuts.length} statuts
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              sfx.click();
              setFilter(f.id);
            }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-extrabold transition-colors ${
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {list.map((q, i) => (
          <div
            key={q.id}
            style={{ animationDelay: `${Math.min(i * 25, 400)}ms` }}
            className="flex flex-col overflow-hidden rounded-2xl bg-card shadow animate-pop"
          >
            <div
              className={`${themeClass(q.theme)} flex aspect-[9/13] flex-col items-center justify-center p-4 text-center ${q.theme === "lime" ? "text-primary-foreground" : "text-secondary-foreground"}`}
            >
              <span className="text-4xl">{q.emoji}</span>
              <p
                className={`mt-3 font-bold leading-snug ${q.kind === "sticker" ? "text-lg" : "text-sm"}`}
              >
                {q.content}
              </p>
              {q.author && <p className="mt-2 text-xs font-semibold opacity-85">— {q.author}</p>}
            </div>
            <div className="grid grid-cols-3 divide-x divide-border/50 border-t border-border/50">
              <button
                onClick={() => download(q)}
                title="Télécharger l'image"
                className="flex items-center justify-center gap-1 py-2.5 text-[11px] font-bold hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" /> Image
              </button>
              <button
                onClick={() => copyText(q)}
                title="Copier le texte"
                className="flex items-center justify-center gap-1 py-2.5 text-[11px] font-bold hover:bg-muted"
              >
                <Copy className="h-3.5 w-3.5" /> Copier
              </button>
              <button
                onClick={() => share(q)}
                title="Partager sur WhatsApp"
                className="flex items-center justify-center gap-1 py-2.5 text-[11px] font-bold text-success hover:bg-muted"
              >
                <Share2 className="h-3.5 w-3.5" /> Statut
              </button>
            </div>
          </div>
        ))}
      </div>
      <AdSlot slot="statuts" />
    </div>
  );
}
