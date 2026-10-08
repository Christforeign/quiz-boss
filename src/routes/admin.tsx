import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Pencil, Trash2, Plus, Check, X, LogOut, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PAGE_SLOTS, PAGE_STATUS, SETTING_KEYS, uploadMedia } from "@/lib/site";

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
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: session!.user.id, _role: "admin" });
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
        <Button variant="outline" className="mt-4" onClick={() => supabase.auth.signOut()}>Se déconnecter</Button>
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
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (error) return void toast.error(error.message);
    if (mode === "up" && !data.session) toast.success("Vérifie ta boîte mail pour confirmer le compte.");
  };
  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-sm space-y-4 rounded-3xl bg-card p-6 animate-pop">
      <h1 className="text-2xl font-extrabold">Admin</h1>
      <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label htmlFor="p">Mot de passe</Label><Input id="p" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <Button className="w-full" disabled={busy}>{mode === "in" ? "Se connecter" : "Créer le compte"}</Button>
      <button type="button" className="w-full text-sm text-muted-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
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
        <Button size="icon" variant="ghost" onClick={() => supabase.auth.signOut()}><LogOut /></Button>
      </div>
      <Tabs defaultValue="withdrawals">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="quotes">Statuts</TabsTrigger>
          <TabsTrigger value="banners">Bannières</TabsTrigger>
          <TabsTrigger value="embeds">Intégrations</TabsTrigger>
          <TabsTrigger value="notifs">Notifications</TabsTrigger>
          <TabsTrigger value="stickers">Stickers</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="settings">Réglages</TabsTrigger>
        </TabsList>
        <TabsContent value="withdrawals"><Withdrawals /></TabsContent>
        <TabsContent value="questions">
          <Crud table="questions" title={(r) => r.question} sub={(r) => `${r.category} · ${r.lang} · ✔ ${r.options?.[r.correct_index]}`} fields={[
            { k: "category", label: "Catégorie (musique, geographie, culture, cinema)" },
            { k: "lang", label: "Langue (fr, ht, en)" },
            { k: "question", label: "Question", long: true },
            { k: "options", label: "Réponses (une par ligne, 4 max)", long: true, list: true },
            { k: "correct_index", label: "Index de la bonne réponse (0 = première)", num: true },
            { k: "image_url", label: "Image (optionnelle)", upload: "questions" },
          ]} />
        </TabsContent>
        <TabsContent value="quotes">
          <Crud table="quotes" title={(r) => `${r.emoji ?? ""} ${r.content}`} sub={(r) => `${r.kind} · ${r.theme}`} fields={[
            { k: "kind", label: "Type (quote, motivation, sticker)" },
            { k: "content", label: "Texte", long: true },
            { k: "author", label: "Auteur (optionnel)" },
            { k: "emoji", label: "Emoji" },
            { k: "theme", label: "Thème (sunset, ocean, lime, night, candy)" },
          ]} />
        </TabsContent>
        <TabsContent value="banners">
          <Crud table="banners" title={(r) => r.title} sub={(r) => `${r.placement} · ${r.active ? "active" : "inactive"}`} fields={[
            { k: "title", label: "Titre" },
            { k: "body", label: "Texte", long: true },
            { k: "image_url", label: "URL de l'image (optionnel)" },
            { k: "link_url", label: "Lien (ex: /invite ou https://…)" },
            { k: "placement", label: "Emplacement (home, result)" },
            { k: "active", label: "Active (true/false)", bool: true },
          ]} />
        </TabsContent>
        <TabsContent value="embeds">
          <Crud table="embeds" title={(r) => r.title} sub={(r) => r.url} fields={[
            { k: "title", label: "Titre" },
            { k: "url", label: "URL (https://…)" },
            { k: "description", label: "Description" },
          ]} />
        </TabsContent>
        <TabsContent value="notifs"><Notifs /></TabsContent>
        <TabsContent value="stickers"><StickerAdmin /></TabsContent>
        <TabsContent value="pages"><PagesAdmin /></TabsContent>
        <TabsContent value="settings"><SettingsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

type Field = { k: string; label: string; long?: boolean; list?: boolean; num?: boolean; bool?: boolean; upload?: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
type CrudTable = "questions" | "quotes" | "banners" | "embeds";

function Crud({ table, fields, title, sub }: { table: CrudTable; fields: Field[]; title: (r: Row) => string; sub: (r: Row) => string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin", table],
    queryFn: async () => ((await supabase.from(table).select("*").order("created_at", { ascending: false })).data ?? []) as Row[],
  });
  const [edit, setEdit] = useState<Row | null>(null);
  const toForm = (r: Row) => Object.fromEntries(fields.map((f) => [f.k, f.list ? (r[f.k] ?? []).join("\n") : String(r[f.k] ?? "")]));
  const save = async () => {
    const payload: Row = {};
    for (const f of fields) {
      const v = (edit![f.k] ?? "").trim();
      payload[f.k] = f.list ? v.split("\n").map((s: string) => s.trim()).filter(Boolean).slice(0, 4) : f.num ? parseInt(v || "0", 10) : f.bool ? v !== "false" : v || null;
    }
    const q = edit!.id ? supabase.from(table).update(payload as never).eq("id", edit!.id) : supabase.from(table).insert(payload as never);
    const { error } = await q;
    if (error) return void toast.error(error.message);
    toast.success("Enregistré");
    setEdit(null);
    qc.invalidateQueries();
  };
  const del = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from(table).delete().eq("id", id);
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
                <div className="flex items-center gap-2">
                  {edit[f.k] && <img src={edit[f.k]} alt="" className="h-12 w-12 rounded object-cover" />}
                  <Input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    try { const url = await uploadMedia(file, f.upload!); setEdit({ ...edit, [f.k]: url }); } catch (err) { toast.error((err as Error).message); }
                  }} />
                  {edit[f.k] && <Button size="sm" variant="ghost" onClick={() => setEdit({ ...edit, [f.k]: "" })}>Retirer</Button>}
                </div>
              ) : f.long ? (
                <Textarea value={edit[f.k] ?? ""} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })} />
              ) : (
                <Input value={edit[f.k] ?? ""} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })} />
              )}
            </div>
          ))}
          <div className="flex gap-2"><Button onClick={save}>Enregistrer</Button><Button variant="ghost" onClick={() => setEdit(null)}>Annuler</Button></div>
        </div>
      ) : (
        <Button onClick={() => setEdit(toForm({}))}><Plus /> Ajouter</Button>
      )}
      {data.map((r) => (
        <div key={r.id} className="flex items-start gap-2 rounded-xl bg-card p-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold">{title(r)}</p>
            <p className="truncate text-xs text-muted-foreground">{sub(r)}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setEdit({ ...toForm(r), id: r.id })}><Pencil /></Button>
          <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 /></Button>
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
    queryFn: async () => (await supabase.from("withdrawals").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("withdrawals").update({ status }).eq("id", id);
    if (error) return void toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
  };
  const list = data.filter((w) => filter === "all" || w.status === filter);
  return (
    <div className="space-y-3 pt-2">
      <div className="flex gap-2">
        {([["pending", "En attente"], ["approved", "Validées"], ["rejected", "Refusées"], ["all", "Toutes"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === k ? "bg-primary text-primary-foreground" : "bg-card"}`}>{l}</button>
        ))}
      </div>
      {list.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Aucune demande.</p>}
      {list.map((w) => (
        <div key={w.id} className="rounded-xl bg-card p-4 text-sm">
          <div className="flex items-center gap-2">
            <b>{w.full_name}</b>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">{w.amount} pièces</span>
            <span className="ml-auto text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString("fr-FR")}</span>
          </div>
          <p className="mt-1 text-muted-foreground">{w.method} · {w.account} · {w.contact} · Niv. {w.level}</p>
          {w.status === "pending" ? (
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="bg-success text-primary-foreground hover:bg-success/90" onClick={() => setStatus(w.id, "approved")}><Check /> Valider</Button>
              <Button size="sm" variant="destructive" onClick={() => setStatus(w.id, "rejected")}><X /> Refuser</Button>
            </div>
          ) : (
            <p className={`mt-2 text-xs font-bold ${w.status === "approved" ? "text-success" : "text-destructive"}`}>{w.status === "approved" ? "Validée" : "Refusée"}</p>
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
    queryFn: async () => (await supabase.from("push_subscribers").select("*", { count: "exact", head: true })).count ?? 0,
  });
  const { data: history = [] } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20)).data ?? [],
  });
  const send = async () => {
    if (!f.title.trim() || !f.body.trim()) return void toast.error("Titre et message requis");
    const { error } = await supabase.from("notifications").insert({ title: f.title.trim(), body: f.body.trim(), url: f.url.trim() || null });
    if (error) return void toast.error(error.message);
    toast.success("Notification envoyée");
    setF({ title: "", body: "", url: "" });
    qc.invalidateQueries({ queryKey: ["admin", "notifications"] });
  };
  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm"><b className="text-primary">{subs}</b> appareils abonnés</p>
      <div className="space-y-3 rounded-2xl bg-card p-4">
        <div><Label>Titre</Label><Input maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div><Label>Message</Label><Textarea maxLength={200} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
        <div><Label>Lien au clic (optionnel, ex: /play/mix)</Label><Input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
        <Button onClick={send}><Send /> Envoyer à tous</Button>
      </div>
      {history.map((n) => (
        <div key={n.id} className="rounded-xl bg-card p-3 text-sm">
          <b>{n.title}</b> <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("fr-FR")}</span>
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
    queryFn: async () => (await supabase.from("sticker_packs").select("id,name,category,stickers(id,image_url)").order("created_at", { ascending: false })).data ?? [],
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin", "sticker-packs"] }); qc.invalidateQueries({ queryKey: ["sticker-packs"] }); };
  const createPack = async () => {
    if (!form.name.trim()) return void toast.error("Nom du pack requis");
    const { error } = await supabase.from("sticker_packs").insert({ name: form.name.trim(), category: form.category.trim() || "Humour" });
    if (error) return void toast.error(error.message);
    setForm({ ...form, name: "" }); refresh();
  };
  const addFiles = async (packId: string, files: FileList | null) => {
    if (!files?.length) return;
    setUploading(packId);
    try {
      for (const file of Array.from(files)) {
        if (!/image\/(webp|png)/.test(file.type)) { toast.error(`${file.name} : WebP ou PNG uniquement`); continue; }
        const url = await uploadMedia(file, `stickers/${packId}`);
        await supabase.from("stickers").insert({ pack_id: packId, image_url: url });
      }
      toast.success("Stickers importés");
    } catch (e) { toast.error((e as Error).message); }
    setUploading(null); refresh();
  };
  return (
    <div className="space-y-3 pt-2">
      <div className="space-y-2 rounded-2xl bg-card p-4">
        <Label>Nouveau pack</Label>
        <Input placeholder="Nom du pack" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Catégorie (Humour, Réactions, Amour…)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <Button onClick={createPack}><Plus /> Créer le pack</Button>
      </div>
      {packs.map((p) => (
        <div key={p.id} className="rounded-2xl bg-card p-4">
          <div className="flex items-center gap-2">
            <b>{p.name}</b><span className="text-xs text-muted-foreground">{p.category} · {p.stickers.length}</span>
            <Button size="icon" variant="ghost" className="ml-auto" onClick={async () => { if (confirm("Supprimer le pack ?")) { await supabase.from("sticker_packs").delete().eq("id", p.id); refresh(); } }}><Trash2 /></Button>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {p.stickers.map((s) => (
              <button key={s.id} title="Supprimer" onClick={async () => { await supabase.from("stickers").delete().eq("id", s.id); refresh(); }} className="aspect-square rounded-lg bg-muted p-1 hover:opacity-60">
                <img src={s.image_url} alt="" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
          <Label className="mt-3 block text-xs text-muted-foreground">{uploading === p.id ? "Import en cours…" : "Importer des stickers (WebP / PNG transparents, plusieurs à la fois)"}</Label>
          <Input type="file" multiple accept="image/webp,image/png" disabled={uploading === p.id} onChange={(e) => addFiles(p.id, e.target.files)} />
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
    setF({ title: current?.title ?? "", mode: current?.mode ?? "image", html: current?.html ?? "", image_url: current?.image_url ?? "", body: current?.body ?? "", status: current?.status ?? "disabled" });
  }, [slug, current]);
  if (!f) return null;
  const save = async () => {
    const { error } = await supabase.from("custom_pages").upsert({ slug, ...f, updated_at: new Date().toISOString() });
    if (error) return void toast.error(error.message);
    toast.success("Page enregistrée");
    qc.invalidateQueries({ queryKey: ["admin", "pages"] }); qc.invalidateQueries({ queryKey: ["custom_pages"] });
  };
  const url = slug.startsWith("page-") ? `/p/${slug}` : `/${slug}`;
  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-wrap gap-2">
        {PAGE_SLOTS.map((p) => {
          const st = pages.find((x) => x.slug === p.slug)?.status;
          return (
            <button key={p.slug} onClick={() => setSlug(p.slug)} className={`rounded-full px-3 py-1 text-xs font-semibold ${slug === p.slug ? "bg-primary text-primary-foreground" : "bg-card"}`}>
              {p.label}{st && st !== "disabled" ? " •" : ""}
            </button>
          );
        })}
      </div>
      <div className="space-y-3 rounded-2xl bg-card p-4">
        <p className="text-xs text-muted-foreground">Adresse publique : <a href={url} target="_blank" rel="noreferrer" className="text-primary">{url}</a></p>
        <div><Label>Titre</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div>
          <Label>Statut</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {PAGE_STATUS.map((s) => (
              <button key={s.id} onClick={() => setF({ ...f, status: s.id })} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${f.status === s.id ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{s.label}</button>
            ))}
          </div>
        </div>
        <div>
          <Label>Type de contenu</Label>
          <div className="mt-1 flex gap-2">
            {[["image", "Image + texte"], ["html", "HTML / CSS / iframe libre"]].map(([k, l]) => (
              <button key={k} onClick={() => setF({ ...f, mode: k })} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${f.mode === k ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{l}</button>
            ))}
          </div>
        </div>
        {f.mode === "html" ? (
          <div><Label>Code HTML</Label><Textarea rows={12} className="font-mono text-xs" value={f.html} onChange={(e) => setF({ ...f, html: e.target.value })} placeholder="<style>…</style><h1>…</h1><iframe src='…'></iframe>" /></div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {f.image_url && <img src={f.image_url} alt="" className="h-12 w-12 rounded object-cover" />}
              <Input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                try { setF({ ...f, image_url: await uploadMedia(file, "pages") }); } catch (err) { toast.error((err as Error).message); }
              }} />
            </div>
            <div><Label>Texte</Label><Textarea rows={10} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
          </>
        )}
        <Button onClick={save}>Enregistrer</Button>
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
  useEffect(() => { setVals(Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]))); }, [rows]);
  const save = async () => {
    const payload = SETTING_KEYS.map(({ key }) => ({ key, value: (vals[key] ?? "").trim(), updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("app_settings").upsert(payload);
    if (error) return void toast.error(error.message);
    toast.success("Réglages enregistrés");
    qc.invalidateQueries({ queryKey: ["settings"] }); qc.invalidateQueries({ queryKey: ["admin", "settings"] });
  };
  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 pt-4">
      {SETTING_KEYS.map(({ key, label }) => (
        <div key={key}>
          <Label>{label}</Label>
          {key === "head_script" ? (
            <Textarea rows={5} className="font-mono text-xs" value={vals[key] ?? ""} onChange={(e) => setVals({ ...vals, [key]: e.target.value })} />
          ) : (
            <Input value={vals[key] ?? ""} onChange={(e) => setVals({ ...vals, [key]: e.target.value })} />
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Les annonces AdSense remplacent automatiquement les emplacements « Publicité » dès que l'ID éditeur est renseigné.</p>
      <Button onClick={save}>Enregistrer</Button>
    </div>
  );
}
