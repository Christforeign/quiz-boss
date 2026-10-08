import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { levelFromXp, updatePlayer, usePlayer, useSession, WITHDRAW_MIN_COINS, WITHDRAW_MIN_LEVEL } from "@/lib/player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/retrait")({
  head: () => ({
    meta: [
      { title: "Retrait de pièces — QuizBoss" },
      { name: "description", content: "Échange tes pièces via MonCash, Natcash, PayPal ou virement bancaire." },
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
  const level = levelFromXp(p.xp);
  const unlocked = level >= WITHDRAW_MIN_LEVEL;
  const [method, setMethod] = useState("MonCash");
  const [form, setForm] = useState({ full_name: "", contact: "", account: "", amount: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(form.amount, 10);
    if (!form.full_name.trim() || !form.contact.trim() || !form.account.trim()) return void toast.error("Remplis tous les champs");
    if (!amount || amount < WITHDRAW_MIN_COINS) return void toast.error(`Minimum ${WITHDRAW_MIN_COINS} pièces`);
    if (amount > p.coins) return void toast.error("Solde insuffisant");
    setBusy(true);
    const { error } = await supabase.from("withdrawals").insert({
      player_id: p.id, user_id: session?.user.id ?? null, full_name: form.full_name.trim().slice(0, 100), contact: form.contact.trim().slice(0, 100),
      account: form.account.trim().slice(0, 200), method, amount, level,
    });
    setBusy(false);
    if (error) return void toast.error("Envoi impossible, réessaie.");
    updatePlayer((x) => ({ coins: x.coins - amount }));
    setForm({ full_name: "", contact: "", account: "", amount: "" });
    toast.success("Demande envoyée ! Elle sera validée manuellement sous 48 h.");
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="rounded-3xl bg-card p-6 animate-pop">
        <Wallet className="h-8 w-8 text-accent" />
        <h1 className="mt-2 text-3xl font-extrabold">Retirer mes pièces</h1>
        <p className="text-sm text-muted-foreground">Solde : <b className="text-accent">{p.coins} pièces</b> · Minimum {WITHDRAW_MIN_COINS}</p>
      </div>

      {!session ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-bold">Connecte-toi pour demander un retrait</p>
          <p className="text-sm text-muted-foreground">Ton compte protège tes pièces et ton historique.</p>
          <Button asChild className="mt-4"><Link to="/auth">Se connecter / S'inscrire</Link></Button>
        </div>
      ) : !unlocked ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-bold">Débloqué au niveau {WITHDRAW_MIN_LEVEL}</p>
          <p className="text-sm text-muted-foreground">Tu es niveau {level}. Continue à jouer pour débloquer les retraits !</p>
          <Button asChild className="mt-4"><Link to="/">Jouer maintenant</Link></Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-card p-5">
          <div>
            <Label>Mode de paiement</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button type="button" key={m} onClick={() => setMethod(m)}
                  className={`rounded-xl border p-3 text-sm font-bold transition-colors ${method === m ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{m}</button>
              ))}
            </div>
          </div>
          <div><Label htmlFor="n">Nom complet</Label><Input id="n" maxLength={100} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label htmlFor="c">Téléphone ou email</Label><Input id="c" maxLength={100} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
          <div><Label htmlFor="a">{method === "Virement" ? "IBAN / numéro de compte" : method === "PayPal" ? "Email PayPal" : `Numéro ${method}`}</Label><Input id="a" maxLength={200} value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} /></div>
          <div><Label htmlFor="m">Montant (pièces)</Label><Input id="m" type="number" min={WITHDRAW_MIN_COINS} max={p.coins} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Envoi…" : "Envoyer la demande"}</Button>
        </form>
      )}
    </div>
  );
}
