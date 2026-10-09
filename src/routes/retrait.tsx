import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Lock, Wallet, CheckCircle2, Clock, XCircle, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  addCoins,
  levelFromXp,
  usePlayer,
  useSession,
  WITHDRAW_MIN_COINS,
  WITHDRAW_MIN_LEVEL,
} from "@/lib/player";
import { useSettings } from "@/lib/site";
import { sfx } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/retrait")({
  head: () => ({
    meta: [
      { title: "Retrait de gains GDS — QuizBoss" },
      {
        name: "description",
        content: "Retire tes GDS via MonCash, Natcash, PayPal ou virement bancaire.",
      },
      { property: "og:title", content: "Retire tes gains — QuizBoss" },
      { property: "og:description", content: "MonCash, Natcash, PayPal ou virement." },
    ],
  }),
  component: Retrait,
});

const METHODS = ["MonCash", "Natcash", "PayPal", "Virement"];

function Retrait() {
  const p = usePlayer();
  const session = useSession();
  const qc = useQueryClient();
  const { data: settings } = useSettings();

  const minCoins = parseInt(settings?.["withdraw_min_amount"] || "", 10) || WITHDRAW_MIN_COINS;
  const minLevel = parseInt(settings?.["withdraw_min_level"] || "", 10) || WITHDRAW_MIN_LEVEL;

  const level = levelFromXp(p.xp);
  const unlocked = level >= minLevel;
  const [method, setMethod] = useState("MonCash");
  const [form, setForm] = useState({ full_name: p.name || "", contact: "", account: "", amount: "" });
  const [busy, setBusy] = useState(false);

  const { data: myWithdrawals = [] } = useQuery({
    queryKey: ["my-withdrawals", p.id, session?.user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []).filter(
        (w) => w.player_id === p.id || (session?.user.id && w.user_id === session.user.id),
      );
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(form.amount, 10);
    if (!form.full_name.trim() || !form.contact.trim() || !form.account.trim()) {
      return void toast.error("Remplis tous les champs");
    }
    if (!amount || amount < minCoins) {
      return void toast.error(`Minimum ${minCoins} GDS`);
    }
    if (amount > p.coins) {
      return void toast.error("Solde insuffisant");
    }
    setBusy(true);
    const { error } = await supabase.from("withdrawals").insert({
      player_id: p.id,
      user_id: session?.user.id ?? null,
      full_name: form.full_name.trim().slice(0, 100),
      contact: form.contact.trim().slice(0, 100),
      account: form.account.trim().slice(0, 200),
      method,
      amount,
      level,
    });
    setBusy(false);
    if (error) return void toast.error("Envoi impossible, réessaie.");
    sfx.coin();
    addCoins(-amount, `Demande de retrait (${method})`, "spend");
    setForm({ full_name: p.name || "", contact: "", account: "", amount: "" });
    qc.invalidateQueries({ queryKey: ["my-withdrawals"] });
    toast.success("Demande de retrait envoyée ! Validation sous 24–48 h.");
  };

  return (
    <div className="space-y-5 pb-6 animate-pop">
      <div className="rounded-3xl bg-card p-6">
        <div className="flex items-center justify-between">
          <Wallet className="h-8 w-8 text-accent" />
          <Button size="sm" variant="secondary" asChild>
            <Link to="/portefeuille">
              <PlusCircle className="h-4 w-4 text-primary" /> Déposer des GDS
            </Link>
          </Button>
        </div>
        <h1 className="mt-2 text-3xl font-extrabold">Retirer mes gains</h1>
        <p className="text-sm text-muted-foreground">
          Solde disponible : <b className="text-accent">{p.coins} GDS</b> · Minimum de retrait :{" "}
          <b>{minCoins} GDS</b> (Niveau {minLevel}+)
        </p>
      </div>

      {!session ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-bold">Connecte-toi pour demander un retrait</p>
          <p className="text-sm text-muted-foreground">
            Ton compte sécurise ton solde GDS, tes dépôts et tes retraits.
          </p>
          <Button asChild className="mt-4">
            <Link to="/auth">Se connecter / S'inscrire</Link>
          </Button>
        </div>
      ) : !unlocked ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-bold">Retraits débloqués au niveau {minLevel}</p>
          <p className="text-sm text-muted-foreground">
            Tu es actuellement niveau {level}. Joue au quiz ou en duel pour monter de niveau !
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button asChild>
              <Link to="/">Jouer au Quiz</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/duel">Mode Duel</Link>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-card p-5">
          <div>
            <Label>Mode de réception du paiement</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => {
                    sfx.click();
                    setMethod(m);
                  }}
                  className={`rounded-xl border p-3 text-sm font-bold transition-colors ${
                    method === m ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="n">Nom complet du bénéficiaire</Label>
            <Input
              id="n"
              maxLength={100}
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c">Téléphone WhatsApp ou Email de contact</Label>
            <Input
              id="c"
              maxLength={100}
              required
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="a">
              {method === "Virement"
                ? "Banque + IBAN / Numéro de compte"
                : method === "PayPal"
                  ? "Email PayPal"
                  : `Numéro ${method} pour recevoir les GDS`}
            </Label>
            <Input
              id="a"
              maxLength={200}
              required
              value={form.account}
              onChange={(e) => setForm({ ...form, account: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="m">Montant à retirer (en GDS · min {minCoins})</Label>
            <Input
              id="m"
              type="number"
              min={minCoins}
              max={p.coins}
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <Button type="submit" size="lg" className="w-full font-extrabold" disabled={busy}>
            {busy ? "Envoi…" : "Envoyer la demande de retrait"}
          </Button>
        </form>
      )}

      {/* Suivi des retraits du joueur */}
      {myWithdrawals.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-lg font-extrabold">Mes demandes de retrait</h2>
          {myWithdrawals.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 text-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <b className="text-base text-accent">{w.amount} GDS</b>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                    {w.method}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Compte : {w.account} · {new Date(w.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                {w.status === "approved" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-3 py-1 text-xs font-extrabold text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Payé / Validé
                  </span>
                ) : w.status === "rejected" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-3 py-1 text-xs font-extrabold text-destructive">
                    <XCircle className="h-3.5 w-3.5" /> Refusé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-xs font-extrabold text-accent">
                    <Clock className="h-3.5 w-3.5" /> En attente
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
