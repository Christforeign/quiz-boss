import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  LogOut,
  Send,
  Eye,
  Users,
  Music,
  Megaphone,
  Upload,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { toast } from "sonner";
import {
  broadcastAdminUpdate,
  fetchAllRegisteredPlayers,
  fetchDeposits,
  fetchPaymentMethods,
  fetchSupportMessages,
  PAGE_SLOTS,
  PAGE_STATUS,
  savePaymentMethods,
  sendSupportMessage,
  SETTING_KEYS,
  updateDepositStatus,
  uploadMedia,
  type PaymentMethodConfig,
  type SupportMessage,
} from "@/lib/site";
import { resetLocalBalance } from "@/lib/player";
import { generateSmartQuestionsBatch, TOTAL_CATALOG_COUNT } from "@/lib/infiniteQuizCatalog";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administration — QuizBoss" },
      { name: "description", content: "Espace d'administration QuizBoss." },
      { property: "og:title", content: "Administration — QuizBoss" },
      { property: "og:description", content: "Espace réservé aux administrateurs." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: session!.user.id,
        _role: "admin",
      });
      return !!data;
    },
  });
  if (!ready) return null;
  if (!session) return <Login />;
  if (isLoading) return <p className="py-10 text-center text-muted-foreground">Vérification…</p>;
  if (!isAdmin)
    return (
      <div className="py-16 text-center">
        <p className="font-bold">Accès refusé</p>
        <p className="text-sm text-muted-foreground">Ce compte n'est pas administrateur.</p>
        <Button variant="outline" className="mt-4" onClick={() => supabase.auth.signOut()}>
          Se déconnecter
        </Button>
      </div>
    );
  return <Dashboard email={session.user.email ?? ""} />;
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/admin` },
          });
    setBusy(false);
    if (error) return void toast.error(error.message);
    if (mode === "up" && !data.session)
      toast.success("Vérifie ta boîte mail pour confirmer le compte.");
  };
  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-10 max-w-sm space-y-4 rounded-3xl bg-card p-6 animate-pop"
    >
      <h1 className="text-2xl font-extrabold">Admin QuizBoss</h1>
      <div>
        <Label htmlFor="e">Email</Label>
        <Input
          id="e"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="p">Mot de passe</Label>
        <Input
          id="p"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button className="w-full" disabled={busy}>
        {mode === "in" ? "Se connecter" : "Créer le compte"}
      </Button>
      <button
        type="button"
        className="w-full text-sm text-muted-foreground"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
      >
        {mode === "in" ? "Premier accès ? Créer le compte administrateur" : "J'ai déjà un compte"}
      </button>
    </form>
  );
}

function Dashboard({ email }: { email: string }) {
  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-extrabold">Tableau de bord</h1>
        <span className="ml-auto truncate text-xs text-muted-foreground">{email}</span>
        <Button size="icon" variant="ghost" onClick={() => supabase.auth.signOut()}>
          <LogOut />
        </Button>
      </div>
      <Tabs defaultValue="deposits">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="deposits">💳 Dépôts</TabsTrigger>
          <TabsTrigger value="withdrawals">💸 Retraits</TabsTrigger>
          <TabsTrigger value="support">💬 Support Live</TabsTrigger>
          <TabsTrigger value="users">👥 Utilisateurs</TabsTrigger>
          <TabsTrigger value="payment-methods">🏦 Méthodes Paiement/Retrait</TabsTrigger>
          <TabsTrigger value="banners">🖼️ Flyers & Bannières</TabsTrigger>
          <TabsTrigger value="questions">🧠 Questions (+15k)</TabsTrigger>
          <TabsTrigger value="quotes">✨ Statuts</TabsTrigger>
          <TabsTrigger value="embeds">Intégrations</TabsTrigger>
          <TabsTrigger value="notifs">Notifications</TabsTrigger>
          <TabsTrigger value="stickers">Stickers</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Réglages, Musique & Pubs</TabsTrigger>
        </TabsList>
        <TabsContent value="deposits">
          <DepositsAdmin />
        </TabsContent>
        <TabsContent value="withdrawals">
          <Withdrawals />
        </TabsContent>
        <TabsContent value="support">
          <SupportAdmin />
        </TabsContent>
        <TabsContent value="users">
          <UsersAdmin />
        </TabsContent>
        <TabsContent value="payment-methods">
          <PaymentMethodsAdmin />
        </TabsContent>
        <TabsContent value="questions">
          <QuestionsSmartGenerator />
          <Crud
            table="questions"
            title={(r) => r.question}
            sub={(r) =>
              `${r.category} · ${r.lang} · D${r.difficulty ?? 1} · ✔ ${r.options?.[r.correct_index]}`
            }
            fields={[
              {
                k: "category",
                label:
                  "Catégorie (musique, geographie, culture, cinema, informatique, sport, histoire, sciences, logique, bible, anglais)",
              },
              { k: "lang", label: "Langue (fr, ht, en)" },
              { k: "question", label: "Question", long: true },
              { k: "options", label: "Réponses (une par ligne, 4 max)", long: true, list: true },
              { k: "correct_index", label: "Index de la bonne réponse (0 = première)", num: true },
              {
                k: "difficulty",
                label: "Difficulté (1 facile → 5 Boss → 6 Légende)",
                num: true,
              },
              { k: "image_url", label: "Image (optionnelle)", upload: "questions" },
            ]}
          />
        </TabsContent>
        <TabsContent value="quotes">
          <Crud
            table="quotes"
            title={(r) => `${r.emoji ?? ""} ${r.content}`}
            sub={(r) => `${r.kind} · ${r.theme}`}
            fields={[
              { k: "kind", label: "Type (quote, motivation, proverbe, boss, sticker)" },
              { k: "content", label: "Texte", long: true },
              { k: "author", label: "Auteur (optionnel)" },
              { k: "emoji", label: "Emoji" },
              { k: "theme", label: "Thème (sunset, ocean, lime, night, candy)" },
            ]}
          />
        </TabsContent>
        <TabsContent value="banners">
          <div className="mb-2 rounded-2xl bg-card p-3.5 text-xs text-muted-foreground">
            🖼️ Importe ici tes <b>Flyers, affiches ou bannières</b> personnalisés. Si tu laisses le
            texte vide avec une image, le flyer s'affichera en grand format visuel sur le site.
          </div>
          <Crud
            table="banners"
            title={(r) => r.title || "Flyer visuel"}
            sub={(r) => `${r.placement} · ${r.active ? "active" : "inactive"}`}
            fields={[
              { k: "title", label: "Titre du Flyer / Bannière (mettre '-' pour masquer le titre)" },
              {
                k: "body",
                label: "Texte descriptif (laisser vide pour un Flyer image plein format)",
                long: true,
              },
              {
                k: "image_url",
                label: "Image du Flyer / Bannière (Upload direct ou URL)",
                upload: "banners",
              },
              { k: "link_url", label: "Lien au clic (ex: /duel, /invite ou https://…)" },
              {
                k: "placement",
                label: "Emplacement (all, home, home-bottom, result, between-questions, statuts)",
              },
              { k: "active", label: "Active (true/false)", bool: true },
            ]}
          />
        </TabsContent>
        <TabsContent value="embeds">
          <Crud
            table="embeds"
            title={(r) => r.title}
            sub={(r) => r.url}
            fields={[
              { k: "title", label: "Titre" },
              { k: "url", label: "URL (https://…)" },
              { k: "description", label: "Description" },
            ]}
          />
        </TabsContent>
        <TabsContent value="notifs">
          <Notifs />
        </TabsContent>
        <TabsContent value="stickers">
          <StickerAdmin />
        </TabsContent>
        <TabsContent value="pages">
          <PagesAdmin />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DepositsAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["admin", "deposits"],
    refetchInterval: 8000,
    queryFn: fetchDeposits,
  });

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    const updated = await updateDepositStatus(id, status);
    if (!updated) return void toast.error("Demande introuvable");
    toast.success(
      status === "approved"
        ? `Dépôt validé (+${updated.amount} GDS crédités au joueur)`
        : "Demande de dépôt refusée",
    );
    qc.invalidateQueries({ queryKey: ["admin", "deposits"] });
    qc.invalidateQueries({ queryKey: ["my-deposits"] });
  };

  const list = data.filter((d) => filter === "all" || d.status === filter);

  return (
    <div className="space-y-3 pt-2">
      <div className="rounded-2xl bg-card p-3.5 text-xs text-muted-foreground">
        💡 Pour modifier tes numéros de réception <b>MonCash / Natcash / PayPal / Virement</b> ou le
        montant minimum de dépôt, rends-toi dans l'onglet <b>⚙️ Réglages & Comptes</b>.
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", "En attente"],
            ["approved", "Validés"],
            ["rejected", "Refusés"],
            ["all", "Tous"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filter === k ? "bg-primary text-primary-foreground" : "bg-card"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
          <div className="max-w-lg w-full space-y-3 rounded-3xl bg-card p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <b className="text-sm">Preuve de paiement</b>
              <Button size="sm" variant="ghost" onClick={() => setPreviewImg(null)}>
                <X className="h-4 w-4" /> Fermer
              </Button>
            </div>
            <img
              src={previewImg}
              alt="Preuve de paiement"
              className="max-h-[70vh] w-full rounded-2xl object-contain bg-muted"
            />
          </div>
        </div>
      )}

      {list.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucune demande de dépôt dans cette catégorie.
        </p>
      )}

      {list.map((d) => (
        <div key={d.id} className="rounded-2xl bg-card p-4 text-sm space-y-2">
          <div className="flex items-center gap-2">
            <b>{d.full_name}</b>
            <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-extrabold text-accent">
              +{d.amount} GDS
            </span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
              {d.method}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(d.created_at).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Compte expéditeur : <b className="text-foreground">{d.sender_account}</b> · Réf
            transaction :{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
              {d.transaction_ref}
            </code>
          </p>

          {d.notes && (
            <p className="rounded-lg bg-muted/50 p-2 text-xs italic text-muted-foreground">
              Note : {d.notes}
            </p>
          )}

          {d.proof_url && (
            <div className="flex items-center gap-3 pt-1">
              <img
                src={d.proof_url}
                alt="Preuve"
                onClick={() => setPreviewImg(d.proof_url)}
                className="h-16 w-16 cursor-pointer rounded-xl border border-border object-cover hover:opacity-80"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setPreviewImg(d.proof_url)}
              >
                <Eye className="h-4 w-4" /> Voir la preuve en grand
              </Button>
            </div>
          )}

          {d.status === "pending" ? (
            <div className="mt-3 flex gap-2 pt-1">
              <Button
                size="sm"
                className="bg-success text-primary-foreground hover:bg-success/90 font-bold"
                onClick={() => handleAction(d.id, "approved")}
              >
                <Check className="h-4 w-4" /> Valider (+{d.amount} GDS)
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleAction(d.id, "rejected")}
              >
                <X className="h-4 w-4" /> Refuser
              </Button>
            </div>
          ) : (
            <p
              className={`mt-2 text-xs font-extrabold ${
                d.status === "approved" ? "text-success" : "text-destructive"
              }`}
            >
              {d.status === "approved" ? "✓ Validé et crédité" : "✕ Refusé"}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

type Field = {
  k: string;
  label: string;
  long?: boolean;
  list?: boolean;
  num?: boolean;
  bool?: boolean;
  upload?: string;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
type CrudTable = "questions" | "quotes" | "banners" | "embeds";

function Crud({
  table,
  fields,
  title,
  sub,
}: {
  table: CrudTable;
  fields: Field[];
  title: (r: Row) => string;
  sub: (r: Row) => string;
}) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin", table],
    queryFn: async () =>
      ((await supabase.from(table).select("*").order("created_at", { ascending: false })).data ??
        []) as Row[],
  });
  const [edit, setEdit] = useState<Row | null>(null);
  const toForm = (r: Row) =>
    Object.fromEntries(
      fields.map((f) => [f.k, f.list ? (r[f.k] ?? []).join("\n") : String(r[f.k] ?? "")]),
    );
  const save = async () => {
    const payload: Row = {};
    for (const f of fields) {
      const v = (edit![f.k] ?? "").trim();
      payload[f.k] = f.list
        ? v
            .split("\n")
            .map((s: string) => s.trim())
            .filter(Boolean)
            .slice(0, 4)
        : f.num
          ? parseInt(v || "0", 10)
          : f.bool
            ? v !== "false"
            : v || null;
    }
    const q = edit!.id
      ? supabase
          .from(table)
          .update(payload as never)
          .eq("id", edit!.id)
      : supabase.from(table).insert(payload as never);
    const { error } = await q;
    if (error) return void toast.error(error.message);
    toast.success("Enregistré et synchronisé pour tous les joueurs ✅");
    setEdit(null);
    await broadcastAdminUpdate();
    qc.invalidateQueries();
  };
  const del = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from(table).delete().eq("id", id);
    await broadcastAdminUpdate();
    qc.invalidateQueries();
  };
  return (
    <div className="space-y-3 pt-2">
      {edit ? (
        <div className="space-y-3 rounded-2xl bg-card p-4 animate-pop">
          {fields.map((f) => (
            <div key={f.k}>
              <Label>{f.label}</Label>
              {f.upload ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {edit[f.k] && (
                      <img
                        src={edit[f.k]}
                        alt=""
                        className="h-14 w-14 rounded-lg object-cover border border-border"
                      />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadMedia(file, f.upload!);
                          setEdit({ ...edit, [f.k]: url });
                          toast.success("Image importée ✅");
                        } catch (err) {
                          toast.error((err as Error).message);
                        }
                      }}
                    />
                    {edit[f.k] && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEdit({ ...edit, [f.k]: "" })}
                      >
                        Retirer
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Ou coller une URL d'image directe (https://…)"
                    value={edit[f.k] ?? ""}
                    onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })}
                  />
                </div>
              ) : f.long ? (
                <Textarea
                  value={edit[f.k] ?? ""}
                  onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })}
                />
              ) : (
                <Input
                  value={edit[f.k] ?? ""}
                  onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={save}>Enregistrer</Button>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setEdit(toForm({}))}>
          <Plus /> Ajouter
        </Button>
      )}
      {data.map((r) => (
        <div key={r.id} className="flex items-start gap-2 rounded-xl bg-card p-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold">{title(r)}</p>
            <p className="truncate text-xs text-muted-foreground">{sub(r)}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setEdit({ ...toForm(r), id: r.id })}>
            <Pencil />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => del(r.id)}>
            <Trash2 />
          </Button>
        </div>
      ))}
    </div>
  );
}

function Withdrawals() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const { data = [] } = useQuery({
    queryKey: ["admin", "withdrawals"],
    queryFn: async () =>
      (await supabase.from("withdrawals").select("*").order("created_at", { ascending: false }))
        .data ?? [],
  });
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("withdrawals").update({ status }).eq("id", id);
    if (error) return void toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
  };
  const list = data.filter(
    (w) => !w.method?.startsWith("DEPOT:") && (filter === "all" || w.status === filter),
  );
  return (
    <div className="space-y-3 pt-2">
      <div className="flex gap-2">
        {(
          [
            ["pending", "En attente"],
            ["approved", "Validées"],
            ["rejected", "Refusées"],
            ["all", "Toutes"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filter === k ? "bg-primary text-primary-foreground" : "bg-card"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      {list.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Aucune demande.</p>
      )}
      {list.map((w) => (
        <div key={w.id} className="rounded-xl bg-card p-4 text-sm">
          <div className="flex items-center gap-2">
            <b>{w.full_name}</b>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
              {w.amount} GDS
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(w.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">
            {w.method} · {w.account} · {w.contact} · Niv. {w.level}
          </p>
          {w.status === "pending" ? (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                className="bg-success text-primary-foreground hover:bg-success/90"
                onClick={() => setStatus(w.id, "approved")}
              >
                <Check /> Valider
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setStatus(w.id, "rejected")}>
                <X /> Refuser
              </Button>
            </div>
          ) : (
            <p
              className={`mt-2 text-xs font-bold ${
                w.status === "approved" ? "text-success" : "text-destructive"
              }`}
            >
              {w.status === "approved" ? "Validée" : "Refusée"}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function Notifs() {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", body: "", url: "" });
  const { data: subs = 0 } = useQuery({
    queryKey: ["admin", "subs"],
    queryFn: async () =>
      (await supabase.from("push_subscribers").select("*", { count: "exact", head: true })).count ??
      0,
  });
  const { data: history = [] } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: async () =>
      (
        await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)
      ).data ?? [],
  });
  const send = async () => {
    if (!f.title.trim() || !f.body.trim()) return void toast.error("Titre et message requis");
    const { error } = await supabase
      .from("notifications")
      .insert({ title: f.title.trim(), body: f.body.trim(), url: f.url.trim() || null });
    if (error) return void toast.error(error.message);
    toast.success("Notification envoyée");
    setF({ title: "", body: "", url: "" });
    await broadcastAdminUpdate();
    qc.invalidateQueries({ queryKey: ["admin", "notifications"] });
  };
  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm">
        <b className="text-primary">{subs}</b> appareils abonnés
      </p>
      <div className="space-y-3 rounded-2xl bg-card p-4">
        <div>
          <Label>Titre</Label>
          <Input
            maxLength={80}
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
        </div>
        <div>
          <Label>Message</Label>
          <Textarea
            maxLength={200}
            value={f.body}
            onChange={(e) => setF({ ...f, body: e.target.value })}
          />
        </div>
        <div>
          <Label>Lien au clic (optionnel, ex: /play/mix)</Label>
          <Input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        </div>
        <Button onClick={send}>
          <Send /> Envoyer à tous
        </Button>
      </div>
      {history.map((n) => (
        <div key={n.id} className="rounded-xl bg-card p-3 text-sm">
          <b>{n.title}</b>{" "}
          <span className="text-xs text-muted-foreground">
            {new Date(n.created_at).toLocaleString("fr-FR")}
          </span>
          <p className="text-muted-foreground">{n.body}</p>
        </div>
      ))}
    </div>
  );
}

function StickerAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", category: "Humour" });
  const [uploading, setUploading] = useState<string | null>(null);
  const { data: packs = [] } = useQuery({
    queryKey: ["admin", "sticker-packs"],
    queryFn: async () =>
      (
        await supabase
          .from("sticker_packs")
          .select("id,name,category,stickers(id,image_url)")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "sticker-packs"] });
    qc.invalidateQueries({ queryKey: ["sticker-packs"] });
  };
  const createPack = async () => {
    if (!form.name.trim()) return void toast.error("Nom du pack requis");
    const { error } = await supabase
      .from("sticker_packs")
      .insert({ name: form.name.trim(), category: form.category.trim() || "Humour" });
    if (error) return void toast.error(error.message);
    setForm({ ...form, name: "" });
    refresh();
  };
  const addFiles = async (packId: string, files: FileList | null) => {
    if (!files?.length) return;
    setUploading(packId);
    try {
      for (const file of Array.from(files)) {
        if (!/image\/(webp|png)/.test(file.type)) {
          toast.error(`${file.name} : WebP ou PNG uniquement`);
          continue;
        }
        const url = await uploadMedia(file, `stickers/${packId}`);
        await supabase.from("stickers").insert({ pack_id: packId, image_url: url });
      }
      toast.success("Stickers importés");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setUploading(null);
    refresh();
  };
  return (
    <div className="space-y-3 pt-2">
      <div className="space-y-2 rounded-2xl bg-card p-4">
        <Label>Nouveau pack</Label>
        <Input
          placeholder="Nom du pack"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          placeholder="Catégorie (Humour, Réactions, Amour…)"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <Button onClick={createPack}>
          <Plus /> Créer le pack
        </Button>
      </div>
      {packs.map((p) => (
        <div key={p.id} className="rounded-2xl bg-card p-4">
          <div className="flex items-center gap-2">
            <b>{p.name}</b>
            <span className="text-xs text-muted-foreground">
              {p.category} · {p.stickers.length}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="ml-auto"
              onClick={async () => {
                if (confirm("Supprimer le pack ?")) {
                  await supabase.from("sticker_packs").delete().eq("id", p.id);
                  refresh();
                }
              }}
            >
              <Trash2 />
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {p.stickers.map((s) => (
              <button
                key={s.id}
                title="Supprimer"
                onClick={async () => {
                  await supabase.from("stickers").delete().eq("id", s.id);
                  refresh();
                }}
                className="aspect-square rounded-lg bg-muted p-1 hover:opacity-60"
              >
                <img src={s.image_url} alt="" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
          <Label className="mt-3 block text-xs text-muted-foreground">
            {uploading === p.id
              ? "Import en cours…"
              : "Importer des stickers (WebP / PNG transparents, plusieurs à la fois)"}
          </Label>
          <Input
            type="file"
            multiple
            accept="image/webp,image/png"
            disabled={uploading === p.id}
            onChange={(e) => addFiles(p.id, e.target.files)}
          />
        </div>
      ))}
    </div>
  );
}

function PagesAdmin() {
  const qc = useQueryClient();
  const { data: pages = [] } = useQuery({
    queryKey: ["admin", "pages"],
    queryFn: async () => (await supabase.from("custom_pages").select("*")).data ?? [],
  });
  const [slug, setSlug] = useState<string>(PAGE_SLOTS[0].slug);
  const current = pages.find((p) => p.slug === slug);
  const [f, setF] = useState<Row>(null);
  useEffect(() => {
    setF({
      title: current?.title ?? "",
      mode: current?.mode ?? "image",
      html: current?.html ?? "",
      image_url: current?.image_url ?? "",
      body: current?.body ?? "",
      status: current?.status ?? "disabled",
    });
  }, [slug, current]);
  if (!f) return null;
  const save = async () => {
    const { error } = await supabase
      .from("custom_pages")
      .upsert({ slug, ...f, updated_at: new Date().toISOString() });
    if (error) return void toast.error(error.message);
    toast.success("Page enregistrée et mise à jour pour tous les utilisateurs ✅");
    await broadcastAdminUpdate();
    qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    qc.invalidateQueries({ queryKey: ["custom_pages"] });
  };
  const url = slug.startsWith("page-") ? `/p/${slug}` : `/${slug}`;
  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-wrap gap-2">
        {PAGE_SLOTS.map((p) => {
          const st = pages.find((x) => x.slug === p.slug)?.status;
          return (
            <button
              key={p.slug}
              onClick={() => setSlug(p.slug)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                slug === p.slug ? "bg-primary text-primary-foreground" : "bg-card"
              }`}
            >
              {p.label}
              {st && st !== "disabled" ? " •" : ""}
            </button>
          );
        })}
      </div>
      <div className="space-y-3 rounded-2xl bg-card p-4">
        <p className="text-xs text-muted-foreground">
          Adresse publique :{" "}
          <a href={url} target="_blank" rel="noreferrer" className="text-primary">
            {url}
          </a>
        </p>
        <div>
          <Label>Titre</Label>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </div>
        <div>
          <Label>Statut</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {PAGE_STATUS.map((s) => (
              <button
                key={s.id}
                onClick={() => setF({ ...f, status: s.id })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  f.status === s.id ? "border-primary bg-primary/10 text-primary" : "border-border"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Type de contenu</Label>
          <div className="mt-1 flex gap-2">
            {[
              ["image", "Image + texte"],
              ["html", "HTML / CSS / iframe libre"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setF({ ...f, mode: k })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  f.mode === k ? "border-primary bg-primary/10 text-primary" : "border-border"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        {f.mode === "html" ? (
          <div>
            <Label>Code HTML</Label>
            <Textarea
              rows={12}
              className="font-mono text-xs"
              value={f.html}
              onChange={(e) => setF({ ...f, html: e.target.value })}
              placeholder="<style>…</style><h1>…</h1><iframe src='…'></iframe>"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {f.image_url && (
                <img src={f.image_url} alt="" className="h-12 w-12 rounded object-cover" />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setF({ ...f, image_url: await uploadMedia(file, "pages") });
                  } catch (err) {
                    toast.error((err as Error).message);
                  }
                }}
              />
            </div>
            <div>
              <Label>Texte</Label>
              <Textarea
                rows={10}
                value={f.body}
                onChange={(e) => setF({ ...f, body: e.target.value })}
              />
            </div>
          </>
        )}
        <Button onClick={save}>Enregistrer</Button>
      </div>
    </div>
  );
}

function PaymentMethodsAdmin() {
  const qc = useQueryClient();
  const { data: methods = [] } = useQuery({
    queryKey: ["payment_methods"],
    queryFn: fetchPaymentMethods,
  });
  const [list, setList] = useState<PaymentMethodConfig[]>([]);
  const [editing, setEditing] = useState<PaymentMethodConfig | null>(null);

  useEffect(() => {
    setList(methods);
  }, [methods]);

  const handleSaveAll = async (next: PaymentMethodConfig[]) => {
    setList(next);
    await savePaymentMethods(next);
    qc.invalidateQueries({ queryKey: ["payment_methods"] });
    toast.success("Méthodes de paiement et retrait mises à jour !");
  };

  const saveEdit = async () => {
    if (!editing || !editing.name.trim()) {
      return void toast.error("Le nom de la méthode est requis");
    }
    const id =
      editing.id ||
      editing.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 24) ||
      `pm-${Date.now()}`;
    const item = { ...editing, id };
    const exists = list.some((m) => m.id === id);
    const next = exists ? list.map((m) => (m.id === id ? item : m)) : [...list, item];
    await handleSaveAll(next);
    setEditing(null);
  };

  const removeMethod = async (id: string) => {
    const next = list.filter((m) => m.id !== id);
    await handleSaveAll(next);
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="rounded-2xl bg-card p-4 text-xs text-muted-foreground">
        🏦 Configure ici les <b>méthodes de Dépôt et de Retrait</b> affichées aux joueurs (MonCash,
        Natcash, PayPal, Virement, Zelle, USDT, etc.). Tout changement est appliqué immédiatement
        sur les pages Wallet et Retrait.
      </div>

      {editing ? (
        <div className="space-y-3 rounded-2xl bg-card p-4 animate-pop">
          <h3 className="font-extrabold">
            {editing.id ? `Modifier ${editing.name}` : "Nouvelle méthode de paiement / retrait"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Nom affiché (ex: MonCash, Natcash, Zelle)</Label>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Compte / Numéro de réception (pour les dépôts)</Label>
              <Input
                placeholder="Ex: +509 3700-0000 ou email@paypal.com"
                value={editing.receiverAccount}
                onChange={(e) => setEditing({ ...editing, receiverAccount: e.target.value })}
              />
            </div>
            <div>
              <Label>Nom du bénéficiaire affiché</Label>
              <Input
                placeholder="Ex: QuizBoss Haïti"
                value={editing.receiverName}
                onChange={(e) => setEditing({ ...editing, receiverName: e.target.value })}
              />
            </div>
            <div>
              <Label>Question posée au joueur (champ numéro/compte)</Label>
              <Input
                placeholder="Ex: Ton numéro MonCash"
                value={editing.accountLabel}
                onChange={(e) => setEditing({ ...editing, accountLabel: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Instructions de dépôt pour cette méthode</Label>
            <Textarea
              rows={2}
              value={editing.instructions}
              onChange={(e) => setEditing({ ...editing, instructions: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-3 pt-1 text-xs font-bold">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.forDeposit}
                onChange={(e) => setEditing({ ...editing, forDeposit: e.target.checked })}
              />
              Disponible pour Dépôt
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.forWithdrawal}
                onChange={(e) => setEditing({ ...editing, forWithdrawal: e.target.checked })}
              />
              Disponible pour Retrait
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              />
              Méthode Active
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveEdit}>Enregistrer la méthode</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() =>
            setEditing({
              id: "",
              name: "",
              receiverAccount: "",
              receiverName: "QuizBoss",
              accountLabel: "Ton numéro / compte",
              instructions: "Envoie le montant puis joins la capture d'écran du reçu.",
              forDeposit: true,
              forWithdrawal: true,
              active: true,
            })
          }
        >
          <Plus /> Ajouter une méthode de paiement / retrait
        </Button>
      )}

      <div className="space-y-2">
        {list.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-2 rounded-2xl bg-card p-4 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-base">{m.name}</b>
                {m.forDeposit && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                    Dépôt
                  </span>
                )}
                {m.forWithdrawal && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                    Retrait
                  </span>
                )}
                {!m.active && (
                  <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-bold text-destructive">
                    Désactivée
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Réception : <b className="text-foreground">{m.receiverAccount}</b> ({m.receiverName}
                )
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setEditing(m)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => removeMethod(m.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionsSmartGenerator() {
  const qc = useQueryClient();
  const [cat, setCat] = useState("mix");
  const [diff, setDiff] = useState(3);
  const [busy, setBusy] = useState(false);

  const handleGenerate = async () => {
    setBusy(true);
    const batch = generateSmartQuestionsBatch(cat, diff, 8);
    const { error } = await supabase.from("questions").insert(batch as never);
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(`+8 nouvelles questions générées et ajoutées à la base !`);
    qc.invalidateQueries({ queryKey: ["admin", "questions"] });
  };

  return (
    <div className="mb-3 space-y-3 rounded-2xl border border-primary/30 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-primary">
            ⚡ Catalogue Intelligent & IA (+{TOTAL_CATALOG_COUNT.toLocaleString("fr-FR")} Quiz
            intégrés)
          </h3>
          <p className="text-xs text-muted-foreground">
            Le site pioche automatiquement dans le catalogue de +12 480 questions vérifiées. Tu peux
            aussi générer et injecter des lots dans ta table Supabase en 1 clic :
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
        >
          <option value="mix">🎲 Toutes catégories (Mix)</option>
          <option value="musique">🎵 Musique & TikTok</option>
          <option value="geographie">🌍 Géographie & Monde</option>
          <option value="culture">🧠 Culture Générale</option>
          <option value="cinema">🎬 Cinéma & Séries</option>
          <option value="informatique">💻 Informatique & Tech</option>
          <option value="sport">⚽ Sport & Football</option>
          <option value="histoire">🏛️ Histoire & Haïti</option>
          <option value="sciences">🔬 Sciences & Nature</option>
          <option value="logique">🧩 Logique & Maths</option>
          <option value="bible">📖 Bible & Spiritualité</option>
          <option value="anglais">🗣️ Anglais & Langues</option>
        </select>
        <select
          value={diff}
          onChange={(e) => setDiff(Number(e.target.value))}
          className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
        >
          <option value={2}>🎯 Difficulté 2 (Moyen)</option>
          <option value={3}>🔥 Difficulté 3 (Difficile)</option>
          <option value={4}>⚡ Difficulté 4 (Expert)</option>
          <option value={5}>💀 Difficulté 5 (Mode BOSS)</option>
          <option value={6}>👑 Difficulté 6 (Légende)</option>
        </select>
        <Button size="sm" onClick={handleGenerate} disabled={busy}>
          <Plus className="h-4 w-4" /> {busy ? "Génération…" : "Générer +8 Questions"}
        </Button>
      </div>
    </div>
  );
}

function SupportAdmin() {
  const qc = useQueryClient();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin", "support"],
    refetchInterval: 3500,
    queryFn: fetchSupportMessages,
  });

  useEffect(() => {
    const ch = supabase
      .channel("quizboss-support-admin")
      .on("broadcast", { event: "support-msg" }, () => {
        qc.invalidateQueries({ queryKey: ["admin", "support"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  // Grouper les messages par joueur (threadId)
  const threadsMap = new Map<
    string,
    {
      threadId: string;
      playerName: string;
      messages: SupportMessage[];
      lastMessage: SupportMessage;
      needsReply: boolean;
    }
  >();

  for (const m of messages) {
    const existing = threadsMap.get(m.threadId);
    if (!existing) {
      threadsMap.set(m.threadId, {
        threadId: m.threadId,
        playerName: m.playerName,
        messages: [m],
        lastMessage: m,
        needsReply: m.sender === "user",
      });
    } else {
      existing.messages.push(m);
      if (m.sender === "user" && m.playerName) {
        existing.playerName = m.playerName;
      }
      existing.lastMessage = m;
      existing.needsReply = m.sender === "user";
    }
  }

  const threads = Array.from(threadsMap.values()).sort((a, b) =>
    a.lastMessage.createdAt < b.lastMessage.createdAt ? 1 : -1,
  );

  const activeThread = threads.find((t) => t.threadId === selectedThreadId) ?? threads[0] ?? null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim() || sending) return;
    setSending(true);
    try {
      await sendSupportMessage({
        threadId: activeThread.threadId,
        playerName: activeThread.playerName,
        sender: "admin",
        text: replyText.trim(),
      });
      setReplyText("");
      toast.success(`Réponse envoyée en direct dans le widget de ${activeThread.playerName} ✅`);
      qc.invalidateQueries({ queryKey: ["admin", "support"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="rounded-2xl bg-card p-4">
        <h3 className="flex items-center gap-2 font-extrabold text-primary">
          <MessageCircle className="h-4 w-4" /> Support en direct avec les joueurs ({threads.length}{" "}
          conversations)
        </h3>
        <p className="text-xs text-muted-foreground">
          Quand un joueur écrit dans le widget Support du site, son message apparaît ici. Ta réponse
          s'affiche instantanément dans son widget avec une notification sonore.
        </p>
      </div>

      {isLoading && (
        <p className="py-8 text-center text-xs text-muted-foreground">
          Chargement des messages support…
        </p>
      )}

      {!isLoading && threads.length === 0 && (
        <div className="rounded-2xl bg-card py-10 text-center text-sm text-muted-foreground">
          Aucun message support reçu pour le moment.
        </div>
      )}

      {threads.length > 0 && (
        <div className="grid gap-4 md:grid-cols-5">
          {/* Liste des conversations */}
          <div className="space-y-2 md:col-span-2">
            {threads.map((t) => {
              const isSelected = activeThread?.threadId === t.threadId;
              return (
                <button
                  key={t.threadId}
                  type="button"
                  onClick={() => setSelectedThreadId(t.threadId)}
                  className={`flex w-full flex-col gap-1 rounded-2xl border p-3 text-left text-xs transition-all ${
                    isSelected
                      ? "border-primary bg-primary/15 shadow-glow"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <b className="truncate text-sm">{t.playerName}</b>
                    {t.needsReply ? (
                      <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-extrabold text-destructive-foreground">
                        À répondre
                      </span>
                    ) : (
                      <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                        Répondu ✓
                      </span>
                    )}
                  </div>
                  <p className="truncate text-muted-foreground">{t.lastMessage.text}</p>
                  <span className="text-[10px] text-muted-foreground/70">
                    {new Date(t.lastMessage.createdAt).toLocaleString("fr-FR")} ·{" "}
                    {t.messages.length} msg
                  </span>
                </button>
              );
            })}
          </div>

          {/* Fil de discussion actif */}
          {activeThread && (
            <div className="flex flex-col rounded-3xl border border-border bg-card p-4 md:col-span-3">
              <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5">
                <div>
                  <h4 className="font-extrabold text-sm">{activeThread.playerName}</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    ID : {activeThread.threadId}
                  </p>
                </div>
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {activeThread.messages.length} messages
                </span>
              </div>

              <div className="flex max-h-80 min-h-[220px] flex-col gap-2.5 overflow-y-auto pr-1 text-xs">
                {activeThread.messages.map((m) => {
                  const isAdminMsg = m.sender === "admin";
                  return (
                    <div
                      key={m.id}
                      className={`flex max-w-[85%] flex-col ${
                        isAdminMsg ? "self-end items-end" : "self-start items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2 ${
                          isAdminMsg
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-tl-sm bg-muted text-foreground"
                        }`}
                      >
                        <p className="mb-0.5 text-[10px] font-extrabold opacity-80">
                          {isAdminMsg ? "🛡️ Toi (Admin)" : `👤 ${m.playerName}`}
                        </p>
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      </div>
                      <span className="mt-0.5 text-[9px] text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSendReply}
                className="mt-3 flex gap-2 border-t border-border pt-3"
              >
                <Input
                  placeholder={`Répondre à ${activeThread.playerName}…`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="text-xs"
                />
                <Button type="submit" disabled={sending || !replyText.trim()}>
                  <Send className="h-4 w-4" /> Répondre
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UsersAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingCoins, setEditingCoins] = useState<Record<string, string>>({});

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    refetchInterval: 8000,
    queryFn: async () => {
      const [{ data: profiles }, dirPlayers, deposits, { data: withdrawals }] = await Promise.all([
        supabase.from("profiles").select("*").order("updated_at", { ascending: false }),
        fetchAllRegisteredPlayers(),
        fetchDeposits(),
        supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
      ]);

      const map = new Map<
        string,
        {
          id: string;
          profileId?: string;
          pseudo: string;
          avatarUrl?: string;
          coins: number;
          xp: number;
          level: number;
          gamesPlayed: number;
          bestScore: number;
          online: boolean;
          updatedAt: string;
        }
      >();

      for (const dp of dirPlayers) {
        map.set(dp.id, {
          id: dp.id,
          pseudo: dp.pseudo,
          avatarUrl: dp.avatarUrl,
          coins: dp.coins ?? 0,
          xp: dp.xp ?? 0,
          level: dp.level || 1,
          gamesPlayed: dp.gamesPlayed ?? 0,
          bestScore: 0,
          online: Boolean(dp.online),
          updatedAt: dp.updatedAt,
        });
      }

      for (const d of deposits) {
        const key = d.user_id || d.player_id;
        if (key && !map.has(key)) {
          map.set(key, {
            id: key,
            profileId: d.user_id ?? undefined,
            pseudo: d.full_name || `Joueur_${key.slice(0, 5)}`,
            coins: 0,
            xp: 0,
            level: 1,
            gamesPlayed: 0,
            bestScore: 0,
            online: false,
            updatedAt: d.created_at,
          });
        }
      }

      for (const w of withdrawals ?? []) {
        const key = w.user_id || w.player_id;
        if (key && !map.has(key)) {
          map.set(key, {
            id: key,
            profileId: w.user_id ?? undefined,
            pseudo: w.full_name || `Joueur_${key.slice(0, 5)}`,
            coins: 0,
            xp: 0,
            level: w.level || 1,
            gamesPlayed: 0,
            bestScore: 0,
            online: false,
            updatedAt: w.created_at,
          });
        }
      }

      for (const pr of profiles ?? []) {
        const lvl = Math.floor(Math.sqrt((pr.xp ?? 0) / 250)) + 1;
        const key = pr.device_id || pr.id;
        const prev = map.get(key);
        map.set(key, {
          id: key,
          profileId: pr.id,
          pseudo: pr.display_name?.trim() || prev?.pseudo || `User_${pr.id.slice(0, 6)}`,
          avatarUrl: prev?.avatarUrl,
          coins: pr.coins ?? 0,
          xp: pr.xp ?? 0,
          level: lvl,
          gamesPlayed: pr.games_played ?? 0,
          bestScore: pr.best_score ?? 0,
          online: Boolean(
            prev?.online || Date.now() - new Date(pr.updated_at).getTime() < 10 * 60 * 1000,
          ),
          updatedAt: pr.updated_at,
        });
      }

      // Synchroniser l'annuaire Duel avec tous les vrais profils trouvés
      const realDir = Array.from(map.values()).map((u) => ({
        id: u.id,
        pseudo: u.pseudo,
        avatarUrl: u.avatarUrl,
        level: u.level,
        coins: u.coins,
        xp: u.xp,
        gamesPlayed: u.gamesPlayed,
        online: u.online,
        updatedAt: u.updatedAt,
      }));
      try {
        await supabase.from("app_settings").upsert({
          key: "players_directory_json",
          value: JSON.stringify(realDir.slice(0, 200)),
          updated_at: new Date().toISOString(),
        });
      } catch {
        // ignore
      }

      return Array.from(map.values()).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
  });

  const handleUpdateUserCoins = async (
    user: { id: string; profileId?: string; pseudo: string },
    newCoins: number,
  ) => {
    const clean = Math.max(0, Math.round(newCoins));
    if (user.profileId) {
      const { error } = await supabase
        .from("profiles")
        .update({ coins: clean, updated_at: new Date().toISOString() })
        .eq("id", user.profileId);
      if (error) return void toast.error(error.message);
    }
    toast.success(`Solde de ${user.pseudo} mis à jour : ${clean} GDS ✅`);
    await broadcastAdminUpdate();
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const filtered = users.filter(
    (u) =>
      u.pseudo.toLowerCase().includes(search.trim().toLowerCase()) ||
      u.id.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-4">
        <div>
          <h3 className="flex items-center gap-2 font-extrabold text-primary">
            <Users className="h-4 w-4" /> Joueurs disponibles & Utilisateurs ({users.length})
          </h3>
          <p className="text-xs text-muted-foreground">
            Liste en direct des comptes inscrits et joueurs disponibles (synchronisée avec le mode
            Duel Multijoueur).
          </p>
        </div>
        <Input
          placeholder="Rechercher un utilisateur (pseudo ou ID)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs text-xs"
        />
      </div>

      {isLoading && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          Chargement des utilisateurs…
        </p>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="rounded-2xl bg-card py-8 text-center text-sm text-muted-foreground">
          Aucun utilisateur trouvé.
        </p>
      )}

      <div className="space-y-2">
        {filtered.map((u) => {
          const customVal = editingCoins[u.id] ?? String(u.coins);
          return (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4 text-sm"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <PlayerAvatar
                    name={u.pseudo}
                    avatarUrl={u.avatarUrl}
                    size="sm"
                    online={u.online}
                  />
                  <b className="text-base">{u.pseudo}</b>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                    Niv. {u.level} ({u.xp} XP)
                  </span>
                  <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-extrabold text-accent">
                    Solde : {u.coins} GDS
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ID : <code className="rounded bg-muted px-1 py-0.5 font-mono">{u.id}</code> ·{" "}
                  Parties jouées : <b>{u.gamesPlayed}</b> · Meilleur score : <b>{u.bestScore}</b> ·{" "}
                  Vu le {new Date(u.updatedAt).toLocaleString("fr-FR")}
                </p>
              </div>

              {u.profileId && (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={customVal}
                    onChange={(e) => setEditingCoins({ ...editingCoins, [u.id]: e.target.value })}
                    className="h-8 w-24 text-xs font-bold"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdateUserCoins(u, parseInt(customVal || "0", 10))}
                  >
                    Fixer GDS
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleUpdateUserCoins(u, 0)}>
                    0 GDS
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsAdmin() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => (await supabase.from("app_settings").select("*")).data ?? [],
  });
  const [vals, setVals] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setVals(Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""])));
  }, [rows]);

  const save = async (override?: Record<string, string>) => {
    setSaving(true);
    const merged = { ...vals, ...(override ?? {}) };
    const payload = SETTING_KEYS.map(({ key }) => ({
      key,
      value: (merged[key] ?? "").trim(),
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("app_settings").upsert(payload);
    setSaving(false);
    if (error) return void toast.error(error.message);
    toast.success("Réglages enregistrés et mis à jour en direct pour tous les utilisateurs ✅");
    await broadcastAdminUpdate();
    qc.invalidateQueries({ queryKey: ["settings"] });
    qc.invalidateQueries({ queryKey: ["admin", "settings"] });
  };

  const handleGlobalResetBalances = async () => {
    setResetting(true);
    try {
      const stamp = `reset-${Date.now()}`;
      await supabase.from("app_settings").upsert({
        key: "global_balance_reset_at",
        value: stamp,
        updated_at: new Date().toISOString(),
      });
      await supabase
        .from("profiles")
        .update({ coins: 0, updated_at: new Date().toISOString() })
        .neq("id", "00000000-0000-0000-0000-000000000000");
      resetLocalBalance();
      await broadcastAdminUpdate();
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("✅ Le solde GDS de tous les joueurs a été réinitialisé à 0 GDS !");
    } catch {
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-5 pt-2">
      {/* 1. MUSIQUE DE FOND DU SITE (Chanson réelle quand on ne joue pas : Maître Gims, etc.) */}
      <div className="space-y-3 rounded-3xl border-2 border-primary/40 bg-card p-5 shadow-glow">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          <h3 className="text-base font-extrabold text-primary">
            🎵 Musique de fond du site (quand on ne joue pas)
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Colle le lien d'une chanson (MP3/Audio) ou importe un fichier audio depuis ton appareil.
          La chanson joue automatiquement en fond sur le site quand le joueur n'est pas en plein
          quiz/duel, avec affichage des crédits du propriétaire.
        </p>

        <div className="space-y-2">
          <Label>1. Coller un lien direct vers la chanson (URL .mp3, .m4a, .ogg ou audio)</Label>
          <Input
            placeholder="https://exemple.com/maitre-gims-chanson.mp3"
            value={vals["site_bgm_url"] ?? ""}
            onChange={(e) => setVals({ ...vals, site_bgm_url: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5 text-primary" /> 2. Ou uploader un fichier audio (MP3 /
            M4A / WAV / OGG)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.ogg"
              disabled={uploadingMusic}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingMusic(true);
                try {
                  const url = await uploadMedia(file, "music");
                  const nextVals = {
                    ...vals,
                    site_bgm_url: url,
                    site_bgm_credit:
                      vals["site_bgm_credit"] ||
                      file.name.replace(/\.[^.]+$/, "") + " — Crédits au propriétaire",
                  };
                  setVals(nextVals);
                  await save(nextVals);
                  toast.success("🎵 Chanson importée et activée en fond du site !");
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setUploadingMusic(false);
                }
              }}
            />
            {vals["site_bgm_url"] && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const next = { ...vals, site_bgm_url: "" };
                  setVals(next);
                  save(next);
                }}
              >
                Retirer
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>3. Crédits & Artiste affichés (ex: Maître Gims — Crédits au propriétaire)</Label>
          <Input
            placeholder="Ex: Maître Gims — Tous droits réservés au propriétaire"
            value={vals["site_bgm_credit"] ?? ""}
            onChange={(e) => setVals({ ...vals, site_bgm_credit: e.target.value })}
          />
        </div>

        {vals["site_bgm_url"] && (
          <div className="rounded-2xl bg-background/60 p-3 space-y-1.5">
            <p className="text-xs font-bold text-primary">🎧 Aperçu de la chanson active :</p>
            <audio controls src={vals["site_bgm_url"]} className="w-full h-9" />
          </div>
        )}

        <Button onClick={() => save()} disabled={saving || uploadingMusic}>
          {saving ? "Enregistrement…" : "🎵 Enregistrer la musique du site"}
        </Button>
      </div>

      {/* 2. LES 2 FONCTIONS PUB MONETAG (Vignette & In-Page Push + Après Quiz/Duel) & SCRIPT <HEAD> */}
      <div className="space-y-4 rounded-3xl border border-accent/40 bg-card p-5">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-accent" />
          <h3 className="text-base font-extrabold text-accent">
            📢 Publicités Monetag (2 Fonctions : Vignette & In-Page Push + Fin de Quiz/Duel)
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Accepte un <b>Zone ID</b> (ex: <code>11987279</code>), une <b>URL directe</b> (ex:{" "}
          <code>https://n6wxm.com/vignette.min.js</code>), du <b>code JS</b> ou une balise{" "}
          <b>&lt;script&gt;…&lt;/script&gt;</b> complète. Ces publicités ne bloquent jamais les
          boutons de réponse pendant un Quiz ou un Duel et s'affichent aussi automatiquement à la
          fin de chaque partie.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-background/50 p-3 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={(vals["monetag_vignette_enabled"] ?? "true") !== "false"}
              onChange={(e) =>
                setVals({ ...vals, monetag_vignette_enabled: e.target.checked ? "true" : "false" })
              }
            />
            Activer Fonction 1 : Pub Vignette
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-border bg-background/50 p-3 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={(vals["monetag_inpage_enabled"] ?? "true") !== "false"}
              onChange={(e) =>
                setVals({ ...vals, monetag_inpage_enabled: e.target.checked ? "true" : "false" })
              }
            />
            Activer Fonction 2 : Pub In-Push
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={(vals["monetag_postgame_enabled"] ?? "true") !== "false"}
              onChange={(e) =>
                setVals({ ...vals, monetag_postgame_enabled: e.target.checked ? "true" : "false" })
              }
            />
            Pub après chaque Quiz & Duel
          </label>
        </div>

        <div className="space-y-2">
          <Label>
            Vignette Banner — DÉSACTIVÉE (détournait les clics des boutons, ignorée)
          </Label>
          <Textarea
            rows={2}
            className="font-mono text-xs"
            placeholder="11987279 ou <script>(function(s){s.dataset.zone='11987279',s.src='https://n6wxm.com/vignette.min.js'})(...)</script>"
            value={vals["monetag_vignette_zone"] ?? ""}
            onChange={(e) => setVals({ ...vals, monetag_vignette_zone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Fonction Pub 2 — In-Page Push / In-Push (Zone ID, Lien URL, Code JS ou &lt;script&gt;)
          </Label>
          <Textarea
            rows={3}
            className="font-mono text-xs"
            placeholder="Colle ici ton Zone ID, ton URL ou ton script Monetag In-Page Push (In-Push)…"
            value={vals["monetag_inpage_script"] ?? ""}
            onChange={(e) => setVals({ ...vals, monetag_inpage_script: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>
            🎬 Pub Monetag pour Débloquer 1 Duel Gratuit (Lien Direct Smartlink, Zone ID ou Script —
            optionnel, utilise ta Vignette/In-Push par défaut)
          </Label>
          <Input
            className="font-mono text-xs"
            placeholder="Optionnel : https://... (Direct Link Monetag) ou Zone ID / Script dédié aux Duels Gratuits"
            value={vals["monetag_rewarded_url"] ?? ""}
            onChange={(e) => setVals({ ...vals, monetag_rewarded_url: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Jeton de validation Monetag (&lt;meta name="monetag"&gt;)</Label>
          <Input
            placeholder="59029dc25ef25e3de878e23f259217d6"
            value={vals["monetag_meta"] ?? ""}
            onChange={(e) => setVals({ ...vals, monetag_meta: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Script / Code / Lien &lt;head&gt; personnalisé (accepte URL, lien, &lt;meta&gt;,
            &lt;script&gt;, HTML ou JS)
          </Label>
          <Textarea
            rows={4}
            className="font-mono text-xs"
            placeholder="Colle ici n'importe quel script <head>, balise <meta>, lien URL ou code JS…"
            value={vals["head_script"] ?? ""}
            onChange={(e) => setVals({ ...vals, head_script: e.target.value })}
          />
        </div>

        <Button onClick={() => save()} disabled={saving}>
          {saving ? "Enregistrement…" : "📢 Enregistrer les fonctions Publicités & <head>"}
        </Button>
      </div>

      {/* 3. AUTRES RÉGLAGES DU SITE (WhatsApp, Dépôt min, Retrait min, AdSense) */}
      <div className="space-y-3 rounded-2xl bg-card p-4">
        <h3 className="font-extrabold">⚙️ Réglages généraux du site</h3>
        {SETTING_KEYS.filter(
          (k) =>
            ![
              "site_bgm_url",
              "site_bgm_credit",
              "monetag_meta",
              "monetag_vignette_enabled",
              "monetag_vignette_zone",
              "monetag_inpage_enabled",
              "monetag_inpage_script",
              "monetag_postgame_enabled",
              "monetag_rewarded_url",
              "head_script",
            ].includes(k.key),
        ).map(({ key, label }) => (
          <div key={key}>
            <Label>{label}</Label>
            {key === "deposit_instructions" ? (
              <Textarea
                rows={3}
                className="text-xs"
                value={vals[key] ?? ""}
                onChange={(e) => setVals({ ...vals, [key]: e.target.value })}
              />
            ) : (
              <Input
                value={vals[key] ?? ""}
                onChange={(e) => setVals({ ...vals, [key]: e.target.value })}
              />
            )}
          </div>
        ))}
        <Button onClick={() => save()} disabled={saving}>
          Enregistrer tous les réglages
        </Button>
      </div>

      {/* 4. Bloc de réinitialisation globale des soldes GDS */}
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 space-y-2">
        <h3 className="font-extrabold text-destructive">
          🔄 Réinitialisation globale du solde GDS des joueurs
        </h3>
        <p className="text-xs text-muted-foreground">
          Remet immédiatement à <b>0 GDS</b> le solde échangeable de tous les comptes joueurs (local
          et base de données).
        </p>
        <Button
          variant="destructive"
          size="sm"
          disabled={resetting}
          onClick={handleGlobalResetBalances}
        >
          {resetting ? "Réinitialisation…" : "Réinitialiser le solde de tous les joueurs à 0 GDS"}
        </Button>
      </div>

      {/* 5. Liste directe des utilisateurs dans Réglages Admin */}
      <div className="border-t border-border pt-4">
        <UsersAdmin />
      </div>
    </div>
  );
}
