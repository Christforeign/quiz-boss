import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { levelFromXp, updatePlayer, usePlayer, useSession } from "@/lib/player";
import { registerPlayerInDirectory } from "@/lib/site";
import { PlayerAvatar, PlayerProfileEditor } from "@/components/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mon Profil & Compte — QuizBoss" },
      {
        name: "description",
        content:
          "Personnalise ton nom et ta photo de profil pour Joueurs disponibles et connecte-toi pour sauvegarder ton solde GDS.",
      },
      { property: "og:title", content: "Mon Profil & Compte — QuizBoss" },
      {
        property: "og:description",
        content: "Personnalise ton profil et sauvegarde ta progression QuizBoss.",
      },
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
  const [f, setF] = useState({ name: p.name || "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  if (session === undefined) return null;

  const displayName = p.name?.trim() || `Joueur_${p.id.slice(0, 4)}`;

  if (session)
    return (
      <div className="space-y-4 py-4 animate-pop">
        <div className="rounded-3xl bg-card p-6 text-center space-y-4">
          <div className="flex flex-col items-center">
            <PlayerAvatar name={displayName} avatarUrl={p.avatarUrl} size="xl" online={true} />
            <h1 className="mt-3 text-2xl font-extrabold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-xl bg-muted p-3">
              <b className="block text-lg text-accent">{p.coins} GDS</b>solde duel
            </div>
            <div className="rounded-xl bg-muted p-3">
              <b className="block text-lg text-primary">{p.quizPoints ?? 0}</b>pts quiz
            </div>
            <div className="rounded-xl bg-muted p-3">
              <b className="block text-lg">Niv. {levelFromXp(p.xp)}</b>
              {p.gamesPlayed} parties
            </div>
          </div>

          <div className="text-left">
            <PlayerProfileEditor />
          </div>

          <p className="text-xs text-muted-foreground">
            ✅ Ton nom et ta photo de profil apparaissent dans « Joueurs disponibles » et dans les
            Duels.
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            await qc.cancelQueries();
            await supabase.auth.signOut();
            navigate({ to: "/", replace: true });
          }}
        >
          Se déconnecter
        </Button>
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: f.email,
        password: f.password,
      });
      setBusy(false);
      if (error) return void toast.error("Email ou mot de passe incorrect");
      const pseudo =
        p.name?.trim() ||
        (data.user?.user_metadata?.display_name as string) ||
        f.email.split("@")[0] ||
        "Joueur";
      await registerPlayerInDirectory({
        id: data.user?.id || p.id,
        pseudo,
        level: levelFromXp(p.xp),
        avatarUrl: p.avatarUrl,
      });
      toast.success("Bon retour ! 🎮");
      navigate({ to: "/" });
    } else {
      const cleanPseudo = (f.name.trim() || p.name?.trim() || "Joueur").slice(0, 24);
      const { data, error } = await supabase.auth.signUp({
        email: f.email,
        password: f.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: cleanPseudo, avatar_url: p.avatarUrl || null },
        },
      });
      setBusy(false);
      if (error) return void toast.error(error.message);
      if (cleanPseudo) {
        updatePlayer(() => ({ name: cleanPseudo }));
        await registerPlayerInDirectory({
          id: data.user?.id || p.id,
          pseudo: cleanPseudo,
          level: levelFromXp(p.xp),
          avatarUrl: p.avatarUrl,
        });
      }
      if (!data.session) toast.success("Compte créé ! Confirme ton email pour te connecter.");
      else {
        toast.success("Compte créé avec succès ! 🎮");
        navigate({ to: "/" });
      }
    }
  };

  return (
    <div className="mx-auto mt-4 max-w-md space-y-4 animate-pop">
      {/* Carte de personnalisation directe du Nom & Photo de profil (même sans compte) */}
      <div className="space-y-2 rounded-3xl bg-card p-5">
        <h2 className="text-lg font-extrabold">🎨 Mon Profil Public (Nom & Photo)</h2>
        <p className="text-xs text-muted-foreground">
          Personnalise comment ton nom et ta photo de profil apparaissent dans la liste des{" "}
          <b>Joueurs disponibles</b> en Duel :
        </p>
        <PlayerProfileEditor
          onSaved={(newName) => {
            setF((prev) => ({ ...prev, name: newName }));
          }}
        />
      </div>

      {/* Formulaire de connexion / création de compte */}
      <form onSubmit={submit} className="space-y-4 rounded-3xl bg-card p-6">
        <h1 className="text-2xl font-extrabold">
          {mode === "in" ? "Connexion au compte" : "Créer un compte"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Sauvegarde ton solde GDS, ton XP, ton nom et ta photo sur tous tes appareils.
        </p>
        {mode === "up" && (
          <div>
            <Label htmlFor="n">Nom / Pseudo</Label>
            <Input
              id="n"
              required
              maxLength={24}
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
          </div>
        )}
        <div>
          <Label htmlFor="e">Email</Label>
          <Input
            id="e"
            type="email"
            required
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="pw">Mot de passe</Label>
          <Input
            id="pw"
            type="password"
            required
            minLength={8}
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
        </div>
        <Button className="w-full" size="lg" disabled={busy}>
          {mode === "in" ? "Se connecter" : "S'inscrire"}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "Pas encore de compte ? S'inscrire" : "J'ai déjà un compte"}
        </button>
      </form>
    </div>
  );
}
