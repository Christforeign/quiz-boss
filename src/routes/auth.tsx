import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { levelFromXp, usePlayer, useSession } from "@/lib/player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mon compte — QuizBoss" },
      { name: "description", content: "Connecte-toi pour sauvegarder tes pièces, ton XP et ton niveau." },
      { property: "og:title", content: "Mon compte — QuizBoss" },
      { property: "og:description", content: "Sauvegarde ta progression QuizBoss." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const session = useSession();
  const p = usePlayer();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  if (session === undefined) return null;

  if (session)
    return (
      <div className="space-y-4 py-4 animate-pop">
        <div className="rounded-3xl bg-card p-6 text-center">
          <UserRound className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-2 text-2xl font-extrabold">{p.name || "Mon compte"}</h1>
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-xl bg-muted p-3"><b className="block text-lg text-accent">{p.coins}</b>pièces</div>
            <div className="rounded-xl bg-muted p-3"><b className="block text-lg text-primary">{levelFromXp(p.xp)}</b>niveau</div>
            <div className="rounded-xl bg-muted p-3"><b className="block text-lg">{p.gamesPlayed}</b>parties</div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">✅ Ta progression est sauvegardée sur ton compte.</p>
        </div>
        <Button variant="outline" className="w-full" onClick={async () => {
          await qc.cancelQueries(); await supabase.auth.signOut(); navigate({ to: "/", replace: true });
        }}>Se déconnecter</Button>
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      setBusy(false);
      if (error) return void toast.error("Email ou mot de passe incorrect");
      toast.success("Bon retour ! 🎮");
      navigate({ to: "/" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: f.email, password: f.password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: f.name.trim().slice(0, 40) } },
      });
      setBusy(false);
      if (error) return void toast.error(error.message);
      if (!data.session) toast.success("Compte créé ! Confirme ton email pour te connecter.");
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto mt-6 max-w-sm space-y-4 rounded-3xl bg-card p-6 animate-pop">
      <h1 className="text-2xl font-extrabold">{mode === "in" ? "Connexion" : "Créer un compte"}</h1>
      <p className="text-sm text-muted-foreground">Sauvegarde tes pièces, ton XP et ton niveau sur tous tes appareils.</p>
      {mode === "up" && (
        <div><Label htmlFor="n">Pseudo</Label><Input id="n" required maxLength={40} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      )}
      <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div><Label htmlFor="pw">Mot de passe</Label><Input id="pw" type="password" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
      <Button className="w-full" size="lg" disabled={busy}>{mode === "in" ? "Se connecter" : "S'inscrire"}</Button>
      <button type="button" className="w-full text-sm text-muted-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Pas encore de compte ? S'inscrire" : "J'ai déjà un compte"}
      </button>
    </form>
  );
}
