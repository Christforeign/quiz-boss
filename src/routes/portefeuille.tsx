import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Wallet as WalletIcon,
  Upload,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  FileImage,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEPOSIT_MIN_COINS,
  levelFromXp,
  usePlayer,
  useSession,
  WITHDRAW_MIN_COINS,
  WITHDRAW_MIN_LEVEL,
  type Tx,
} from "@/lib/player";
import {
  createDepositRequest,
  fetchDeposits,
  uploadPaymentProof,
  usePaymentMethods,
  useSettings,
} from "@/lib/site";
import { sfx } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/portefeuille")({
  head: () => ({
    meta: [
      { title: "Mon Portefeuille (Dépôt & Retrait GDS) — QuizBoss" },
      {
        name: "description",
        content:
          "Gère ton solde GDS sur QuizBoss : effectue un dépôt (MonCash, Natcash, PayPal, Virement), retire tes gains de duel et consulte ton historique.",
      },
      { property: "og:title", content: "Portefeuille GDS — QuizBoss" },
      {
        property: "og:description",
        content: "Dépôt, retrait et suivi de tes gains de duels en GDS.",
      },
    ],
  }),
  component: Wallet,
});

const KIND: Record<Tx["kind"], string> = {
  solo: "🎯 Quiz Solo (Points non échangeables)",
  duel: "⚔️ Duel Multijoueur (GDS échangeables)",
  reward: "🎁 Bonus",
  spend: "💸 Retrait",
  deposit: "💳 Dépôt GDS",
};

const QUICK_AMOUNTS = [25, 50, 100, 250, 500, 1000];

function Wallet() {
  const p = usePlayer();
  const session = useSession();
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const depositMethods = paymentMethods.filter((m) => m.active && m.forDeposit);

  const [tab, setTab] = useState<"deposit" | "history">("deposit");

  // Deposit Form State
  const [selectedMethodId, setSelectedMethodId] = useState<string>("moncash");
  const activeMethod = depositMethods.find(
    (m) => m.id === selectedMethodId || m.name === selectedMethodId,
  ) ??
    depositMethods[0] ?? {
      id: "moncash",
      name: "MonCash",
      receiverAccount: "+509 3700-0000",
      receiverName: "QuizBoss Haïti",
      accountLabel: "Ton numéro MonCash",
      instructions: "Envoie le montant souhaité puis joins la capture d'écran du reçu.",
      forDeposit: true,
      forWithdrawal: true,
      active: true,
    };

  const [amount, setAmount] = useState("25");
  const [fullName, setFullName] = useState(p.name || "");
  const [senderAccount, setSenderAccount] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const minDeposit = parseInt(settings?.["deposit_min_amount"] || "", 10) || DEPOSIT_MIN_COINS;
  const minWithdraw = parseInt(settings?.["withdraw_min_amount"] || "", 10) || WITHDRAW_MIN_COINS;
  const minWithdrawLevel =
    parseInt(settings?.["withdraw_min_level"] || "", 10) || WITHDRAW_MIN_LEVEL;

  const { data: myDeposits = [] } = useQuery({
    queryKey: ["my-deposits", p.id, session?.user.id],
    refetchInterval: 8000,
    queryFn: async () => {
      const all = await fetchDeposits();
      return all.filter(
        (d) => d.player_id === p.id || (session?.user.id && d.user_id === session.user.id),
      );
    },
  });

  const history = p.history ?? [];
  const gdsHistory = history.filter((h) => (h.unit ?? "GDS") === "GDS" && h.kind !== "solo");
  const earned = gdsHistory.filter((h) => h.amount > 0).reduce((a, h) => a + h.amount, 0);
  const spent = gdsHistory.filter((h) => h.amount < 0).reduce((a, h) => a - h.amount, 0);
  const lvl = levelFromXp(p.xp);

  const customInstructions =
    activeMethod.instructions ||
    settings?.["deposit_instructions"] ||
    "1. Envoie le montant souhaité sur le compte indiqué ci-dessous.\n2. Prends une capture d'écran du reçu de confirmation.\n3. Remplis ce formulaire avec le code de transaction et la capture d'écran.";

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return void toast.error("Sélectionne une image (PNG, JPG, WebP)");
    }
    setUploadingProof(true);
    try {
      const url = await uploadPaymentProof(file);
      setProofUrl(url);
      toast.success("Preuve de paiement jointe ✅");
    } catch (err) {
      toast.error((err as Error).message || "Erreur lors de l'import de l'image");
    } finally {
      setUploadingProof(false);
    }
  };

  const submitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount < minDeposit) {
      return void toast.error(`Le montant minimum de dépôt est de ${minDeposit} GDS`);
    }
    if (!fullName.trim() || !senderAccount.trim() || !transactionRef.trim()) {
      return void toast.error("Remplis ton nom, ton numéro/compte et l'ID de transaction");
    }
    if (!proofUrl) {
      return void toast.error("Merci de joindre une capture d'écran (preuve de paiement)");
    }

    setSubmitting(true);
    try {
      await createDepositRequest({
        player_id: p.id,
        user_id: session?.user.id ?? null,
        full_name: fullName.trim().slice(0, 100),
        sender_account: senderAccount.trim().slice(0, 100),
        method: activeMethod.name,
        amount: numAmount,
        transaction_ref: transactionRef.trim().slice(0, 100),
        proof_url: proofUrl,
        notes: notes.trim().slice(0, 250) || null,
      });
      sfx.coin();
      toast.success(
        "Demande de dépôt envoyée ! Ta preuve est en cours de vérification et ton solde sera crédité sous peu.",
      );
      setTransactionRef("");
      setProofUrl(null);
      setNotes("");
      qc.invalidateQueries({ queryKey: ["my-deposits"] });
    } catch {
      toast.error("Impossible d'envoyer la demande, réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 py-2 animate-pop">
      {/* Solde Card */}
      <div className="rounded-3xl bg-grad-lime p-6 text-primary-foreground shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-xs font-extrabold uppercase tracking-wider opacity-85">
            Solde Échangeable (Duels & Dépôts)
          </p>
          <span className="rounded-full bg-background/20 px-3 py-1 text-xs font-extrabold">
            Niveau {lvl} · {p.quizPoints ?? 0} Pts Quiz
          </span>
        </div>
        <p className="mt-2 flex items-center gap-2 text-5xl font-extrabold">
          <Coins className="h-10 w-10" /> {p.coins} <span className="text-2xl">GDS</span>
        </p>
        <p className="mt-1 text-xs font-semibold opacity-90">
          Seul l'argent gagné en <b>Duel avec mise</b> (ou déposé) est échangeable et retirable. Les
          points gagnés en quiz normal servent uniquement à monter de niveau.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Button
            size="sm"
            onClick={() => {
              sfx.click();
              setTab("deposit");
            }}
            className="bg-background text-foreground hover:bg-background/90 font-extrabold"
          >
            <PlusCircle className="h-4 w-4 text-primary" /> Déposer (GDS)
          </Button>
          <Button
            size="sm"
            variant="secondary"
            asChild
            className="bg-background/25 text-primary-foreground hover:bg-background/35 font-extrabold"
          >
            <Link to="/retrait">
              <WalletIcon className="h-4 w-4" /> Retirer mes gains
            </Link>
          </Button>
        </div>
      </div>

      {/* Résumé Gains / Dépenses / Points Quiz */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-card p-3.5">
          <p className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            <ArrowDownLeft className="h-3.5 w-3.5 text-success" /> Gagné / Déposé
          </p>
          <p className="mt-1 text-xl font-extrabold text-success">+{earned} GDS</p>
        </div>
        <div className="rounded-2xl bg-card p-3.5">
          <p className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            <ArrowUpRight className="h-3.5 w-3.5 text-destructive" /> Misé / Retiré
          </p>
          <p className="mt-1 text-xl font-extrabold text-destructive">−{spent} GDS</p>
        </div>
        <div className="rounded-2xl bg-card p-3.5">
          <p className="text-[11px] font-bold text-muted-foreground">🎯 Points Solo</p>
          <p className="mt-1 text-xl font-extrabold text-primary">{p.quizPoints ?? 0} PTS</p>
          <span className="text-[10px] text-muted-foreground">Non échangeable</span>
        </div>
      </div>

      {/* Navigation Onglets : Dépôt vs Historique */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-card p-1.5">
        <button
          type="button"
          onClick={() => {
            sfx.click();
            setTab("deposit");
          }}
          className={`rounded-xl py-2.5 text-sm font-extrabold transition-colors ${
            tab === "deposit" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          💳 Dépôt GDS
        </button>
        <button
          type="button"
          onClick={() => {
            sfx.click();
            setTab("history");
          }}
          className={`rounded-xl py-2.5 text-sm font-extrabold transition-colors ${
            tab === "history" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          📜 Historique ({history.length})
        </button>
      </div>

      {tab === "deposit" ? (
        <div className="space-y-5">
          <form onSubmit={submitDeposit} className="space-y-4 rounded-3xl bg-card p-5">
            <div>
              <h2 className="text-xl font-extrabold">Recharger mon Portefeuille (Dépôt)</h2>
              <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                {customInstructions}
              </p>
            </div>

            {/* 1. Choix du moyen de paiement */}
            <div>
              <Label>1. Moyen de paiement</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {depositMethods.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      sfx.click();
                      setSelectedMethodId(m.id);
                    }}
                    className={`rounded-xl border p-3 text-sm font-extrabold transition-all ${
                      activeMethod.id === m.id
                        ? "border-primary bg-primary/15 text-primary shadow-glow"
                        : "border-border bg-background/40"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Coordonnées du compte de réception */}
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Compte {activeMethod.name} de réception
              </p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-base font-extrabold text-foreground break-all">
                  {activeMethod.receiverAccount}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(activeMethod.receiverAccount);
                    toast.success("Coordonnées copiées !");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copier
                </Button>
              </div>
              {activeMethod.receiverName && (
                <p className="text-xs text-muted-foreground">
                  Bénéficiaire : <b className="text-foreground">{activeMethod.receiverName}</b>
                </p>
              )}
            </div>

            {/* 2. Montant du dépôt */}
            <div>
              <Label htmlFor="dep-amount">
                2. Montant envoyé en GDS (Minimum {minDeposit} GDS)
              </Label>
              <div className="mt-2 flex flex-wrap gap-1.5 mb-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => {
                      sfx.click();
                      setAmount(String(amt));
                    }}
                    className={`rounded-lg px-3 py-1 text-xs font-extrabold transition-colors ${
                      amount === String(amt)
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {amt} GDS
                  </button>
                ))}
              </div>
              <Input
                id="dep-amount"
                type="number"
                min={minDeposit}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* 3. Infos de l'expéditeur */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="dep-name">3. Ton nom complet</Label>
                <Input
                  id="dep-name"
                  placeholder="Ex: Jean Baptiste"
                  required
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dep-acc">
                  4. {activeMethod.accountLabel || "Numéro / Compte expéditeur"}
                </Label>
                <Input
                  id="dep-acc"
                  placeholder="Saisis ton numéro ou compte utilisé"
                  required
                  maxLength={100}
                  value={senderAccount}
                  onChange={(e) => setSenderAccount(e.target.value)}
                />
              </div>
            </div>

            {/* 5. Référence de transaction */}
            <div>
              <Label htmlFor="dep-ref">
                5. ID / Référence de la transaction ({activeMethod.name})
              </Label>
              <Input
                id="dep-ref"
                placeholder="Ex: TXN-94827104 ou numéro de reçu"
                required
                maxLength={100}
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
              />
            </div>

            {/* 6. Preuve de paiement (Upload capture d'écran) */}
            <div className="space-y-2">
              <Label>6. Preuve de paiement (Capture d'écran du reçu obligatoire)</Label>
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-background/40 p-4">
                {proofUrl ? (
                  <div className="space-y-2">
                    <img
                      src={proofUrl}
                      alt="Preuve de paiement"
                      className="max-h-52 w-full rounded-xl object-contain bg-muted"
                    />
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs font-bold text-success">
                        <CheckCircle2 className="h-4 w-4" /> Capture d'écran prête
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setProofUrl(null)}
                      >
                        Changer l'image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 py-3 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                      {uploadingProof ? (
                        <Clock className="h-5 w-5 animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs font-bold">
                      {uploadingProof
                        ? "Chargement de la capture…"
                        : "Clique ici pour importer la capture d'écran du paiement"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Formats acceptés : PNG, JPG, WebP
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingProof}
                      onChange={handleProofUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Note optionnelle */}
            <div>
              <Label htmlFor="dep-note">Note ou commentaire (optionnel)</Label>
              <Textarea
                id="dep-note"
                rows={2}
                placeholder="Précision éventuelle sur ton paiement…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-extrabold"
              disabled={submitting || uploadingProof}
            >
              {submitting ? "Envoi en cours…" : `Envoyer ma demande de dépôt (${amount || 0} GDS)`}
            </Button>
          </form>

          {/* Suivi des demandes de dépôt du joueur */}
          <section className="space-y-2.5">
            <h3 className="text-lg font-extrabold">Mes demandes de dépôt</h3>
            {myDeposits.length === 0 ? (
              <p className="rounded-2xl bg-card p-5 text-center text-sm text-muted-foreground">
                Aucune demande de dépôt pour l'instant.
              </p>
            ) : (
              myDeposits.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 text-sm"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <b className="text-base text-accent">+{d.amount} GDS</b>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                        {d.method}
                      </span>
                      {d.proof_url && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileImage className="h-3.5 w-3.5" /> Preuve jointe
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Réf: {d.transaction_ref} ·{" "}
                      {new Date(d.created_at).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {d.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-3 py-1 text-xs font-extrabold text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Validé
                      </span>
                    ) : d.status === "rejected" ? (
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
              ))
            )}
          </section>

          <div className="rounded-2xl bg-card p-4 text-sm">
            Retraits débloqués au <b>niveau {minWithdrawLevel}</b> dès <b>{minWithdraw} GDS</b>. Tu
            es actuellement <b>niveau {lvl}</b>.
            <Button asChild size="sm" variant="secondary" className="mt-3 w-full font-bold">
              <Link to="/retrait">Aller à la page Retrait</Link>
            </Button>
          </div>
        </div>
      ) : (
        <section className="space-y-2.5">
          <h2 className="text-lg font-extrabold">Historique des opérations</h2>
          {history.length === 0 ? (
            <p className="rounded-2xl bg-card p-6 text-center text-muted-foreground">
              Aucune opération pour l'instant. Lance une partie ou un duel !
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((h, i) => {
                const unit = h.unit ?? (h.kind === "solo" ? "PTS" : "GDS");
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{h.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {KIND[h.kind] ?? "🪙 Opération"} ·{" "}
                        {new Date(h.t).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-extrabold ${
                        unit === "PTS"
                          ? "text-primary"
                          : h.amount >= 0
                            ? "text-success"
                            : "text-destructive"
                      }`}
                    >
                      {h.amount >= 0 ? "+" : ""}
                      {h.amount} {unit}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
