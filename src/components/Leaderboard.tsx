import { useEffect, useState } from "react";
import { Trophy, Swords } from "lucide-react";
import { fetchLeaderboard, type LeaderRow } from "@/lib/leaderboard";

export function Leaderboard() {
  const [data, setData] = useState<{ solo: LeaderRow[]; duel: LeaderRow[] } | null>(null);
  const [tab, setTab] = useState<"solo" | "duel">("solo");
  useEffect(() => {
    fetchLeaderboard().then(setData);
  }, []);
  const rows = data?.[tab] ?? [];
  return (
    <section className="rounded-3xl bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Trophy className="h-5 w-5 text-accent" /> Meilleurs scores
        </h2>
        <div className="flex gap-1 rounded-full bg-muted p-1 text-xs font-bold">
          {(["solo", "duel"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {t === "solo" ? "Solo" : "Duel"}
            </button>
          ))}
        </div>
      </div>
      {!data ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun score encore. Sois le premier !</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2 text-sm">
              <span className="w-6 font-extrabold text-accent">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
              <span className="flex-1 truncate font-semibold">{r.name}</span>
              <span className="flex items-center gap-1 font-extrabold text-primary">
                {tab === "duel" && <Swords className="h-3.5 w-3.5" />}
                {r.value} {tab === "solo" ? "pts" : "victoires"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
