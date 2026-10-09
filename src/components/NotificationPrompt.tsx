import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getPlayer } from "@/lib/player";
import { toast } from "sonner";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem("quizboss-notif-dismissed")) return;
    const t = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const enable = async () => {
    // Permission is requested only after an explicit user click (browser policy).
    const res = await Notification.requestPermission();
    setShow(false);
    if (res === "granted") {
      await supabase.from("push_subscribers").insert({ device_id: getPlayer().id });
      toast.success("Notifications activées 🔔");
    } else {
      localStorage.setItem("quizboss-notif-dismissed", "1");
    }
  };

  return (
    <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-3 animate-pop">
      <Bell className="h-5 w-5 shrink-0 text-primary" />
      <p className="text-sm">Reçois les nouveaux défis et bonus de pièces ?</p>
      <Button size="sm" onClick={enable} className="ml-auto">
        Activer
      </Button>
      <button
        aria-label="Fermer"
        onClick={() => {
          localStorage.setItem("quizboss-notif-dismissed", "1");
          setShow(false);
        }}
        className="text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
