import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Megaphone, Sparkles, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updatePlayer, usePlayer } from "@/lib/player";
import {
  fetchSupportMessages,
  sendSupportMessage,
  triggerCrossPlatformNotification,
  useSettings,
  type SupportMessage,
} from "@/lib/site";
import { sfx } from "@/lib/sound";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const SEEN_SUPPORT_KEY = "quizboss-seen-support-ids";

function getSeenAdminReplyIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_SUPPORT_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markAdminRepliesSeen(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  try {
    const set = getSeenAdminReplyIds();
    for (const id of ids) set.add(id);
    window.localStorage.setItem(SEEN_SUPPORT_KEY, JSON.stringify(Array.from(set).slice(-200)));
  } catch {
    // ignore
  }
}

export function SupportWidget() {
  const player = usePlayer();
  const { data: settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const [nameInput, setNameInput] = useState(player.name || "");
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const whatsappSupport = settings?.["whatsapp_support"]?.replace(/\D/g, "");
  const whatsappChannel = settings?.["whatsapp_channel"]?.trim();

  useEffect(() => {
    if (player.name && !nameInput) {
      setNameInput(player.name);
    }
  }, [player.name, nameInput]);

  useEffect(() => {
    if (!player.id) return;

    const syncMessages = async () => {
      const all = await fetchSupportMessages();
      const mine = all.filter((m) => m.threadId === player.id);
      setMessages(mine);

      const adminReplies = mine.filter((m) => m.sender === "admin");
      const seen = getSeenAdminReplyIds();
      const unseen = adminReplies.filter((m) => !seen.has(m.id));

      if (open) {
        if (unseen.length > 0) {
          markAdminRepliesSeen(unseen.map((u) => u.id));
        }
        setUnreadCount(0);
      } else {
        if (unseen.length > unreadCount && unseen.length > 0) {
          const latest = unseen[unseen.length - 1]!;
          sfx.coin();
          toast("💬 Nouvelle réponse du Support QuizBoss !", {
            description: latest.text,
            action: {
              label: "Ouvrir",
              onClick: () => setOpen(true),
            },
          });
          triggerCrossPlatformNotification(
            "💬 Réponse du Support QuizBoss",
            latest.text,
            window.location.pathname,
            `support-${latest.id}`,
          );
        }
        setUnreadCount(unseen.length);
      }
    };

    syncMessages();
    const timer = setInterval(syncMessages, 4000);

    const ch = supabase
      .channel("quizboss-support")
      .on("broadcast", { event: "support-msg" }, ({ payload }) => {
        const msg = payload?.message as SupportMessage | undefined;
        if (msg && msg.threadId === player.id) {
          syncMessages();
        }
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(ch);
    };
  }, [player.id, open, unreadCount]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    sfx.click();
    const displayName = nameInput.trim() || player.name || `Joueur_${player.id.slice(0, 4)}`;
    if (nameInput.trim() && nameInput.trim() !== player.name) {
      updatePlayer(() => ({ name: nameInput.trim() }));
    }
    try {
      const sent = await sendSupportMessage({
        threadId: player.id,
        playerName: displayName,
        sender: "user",
        text: trimmed,
      });
      setMessages((prev) => [...prev, sent]);
      setText("");
    } catch {
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex w-[320px] sm:w-[350px] flex-col overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-2xl animate-pop">
          {/* Header */}
          <div className="flex items-center justify-between bg-grad-ocean px-4 py-3 text-secondary-foreground">
            <div className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-background/20">
                <MessageCircle className="h-4 w-4" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold leading-tight">Support en direct</h3>
                <p className="text-[10px] font-semibold opacity-90">
                  Écris-nous, nous te répondons ici en direct
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-background/20 p-1.5 transition-transform active:scale-90"
              aria-label="Fermer le support"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick links if WhatsApp is configured */}
          {(whatsappSupport || whatsappChannel) && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-muted/40 px-3 py-1.5 text-[11px]">
              {whatsappSupport && (
                <a
                  href={`https://wa.me/${whatsappSupport}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 font-bold text-success hover:bg-success/25"
                >
                  <MessageCircle className="h-3 w-3" /> WhatsApp Direct
                </a>
              )}
              {whatsappChannel && (
                <a
                  href={whatsappChannel}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 font-bold text-primary hover:bg-primary/25"
                >
                  <Megaphone className="h-3 w-3" /> Chaîne officielle
                </a>
              )}
            </div>
          )}

          {/* Pseudo input if not set */}
          <div className="border-b border-border/60 bg-background/40 px-3 py-1.5">
            <input
              type="text"
              placeholder="Ton pseudo ou nom (pour te répondre)…"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Messages thread */}
          <div
            ref={listRef}
            className="flex max-h-72 min-h-[210px] flex-col gap-2.5 overflow-y-auto p-3 text-xs"
          >
            <div className="self-start max-w-[85%] rounded-2xl rounded-tl-sm bg-muted p-2.5 text-foreground">
              <p className="mb-0.5 flex items-center gap-1 text-[10px] font-extrabold text-primary">
                <Sparkles className="h-3 w-3" /> Équipe QuizBoss
              </p>
              <p>
                Bonjour 👋 ! Une question sur un dépôt, un retrait, un duel ou ton compte ? Écris
                ton message ci-dessous, notre réponse s'affichera directement ici.
              </p>
            </div>

            {messages.map((m) => {
              const isMe = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[85%] ${
                    isMe ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-3 py-2 ${
                      isMe
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm border border-primary/30 bg-muted text-foreground"
                    }`}
                  >
                    {!isMe && (
                      <p className="mb-0.5 text-[10px] font-extrabold text-primary">
                        🛡️ Support QuizBoss
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                  </div>
                  <span className="mt-0.5 flex items-center gap-1 px-1 text-[9px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {isMe && <CheckCheck className="h-2.5 w-2.5 text-primary" />}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input form */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-1.5 border-t border-border bg-background/70 p-2.5"
          >
            <Input
              placeholder="Écris ton message ici…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-9 text-xs"
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={sending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <button
        type="button"
        aria-label="Ouvrir le support en direct"
        onClick={() => {
          sfx.click();
          setOpen((v) => !v);
        }}
        className="relative flex h-13 items-center gap-2 rounded-full bg-grad-ocean px-4 py-3 text-xs font-extrabold text-secondary-foreground shadow-xl transition-transform active:scale-95"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span>Support</span>
        {unreadCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-extrabold text-destructive-foreground animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
