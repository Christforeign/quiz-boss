import { supabase } from "@/integrations/supabase/client";

// Classement public stocké dans la table ouverte en lecture/écriture (même principe que les chambres de duel).
const KEY = "QB_SCORE";

type Entry = { k: "solo" | "duel"; id: string; n: string; s: number; t: number };
export type LeaderRow = { id: string; name: string; value: number };

export async function submitScore(kind: "solo" | "duel", id: string, name: string, score: number) {
  if (!id || score <= 0) return;
  const e: Entry = { k: kind, id, n: (name || "Joueur").slice(0, 24), s: score, t: Date.now() };
  try {
    await supabase
      .from("referrals")
      .insert({ referrer_id: KEY, invitee_device: JSON.stringify(e) });
  } catch {
    // ignore
  }
}

export async function fetchLeaderboard(): Promise<{ solo: LeaderRow[]; duel: LeaderRow[] }> {
  const solo = new Map<string, LeaderRow>();
  const duel = new Map<string, LeaderRow>();
  try {
    const { data } = await supabase
      .from("referrals")
      .select("invitee_device")
      .eq("referrer_id", KEY)
      .order("created_at", { ascending: false })
      .limit(1000);
    for (const row of data ?? []) {
      try {
        const e = JSON.parse(row.invitee_device) as Entry;
        if (e.k === "solo") {
          const cur = solo.get(e.id);
          if (!cur || e.s > cur.value)
            solo.set(e.id, {
              id: e.id,
              name: cur?.name ?? e.n,
              value: Math.max(e.s, cur?.value ?? 0),
            });
        } else if (e.k === "duel") {
          const cur = duel.get(e.id);
          duel.set(e.id, { id: e.id, name: cur?.name ?? e.n, value: (cur?.value ?? 0) + 1 });
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  const top = (m: Map<string, LeaderRow>) =>
    [...m.values()].sort((a, b) => b.value - a.value).slice(0, 10);
  return { solo: top(solo), duel: top(duel) };
}
