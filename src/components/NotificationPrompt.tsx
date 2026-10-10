import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getPlayer } from "@/lib/player";
import {
  registerNotificationServiceWorker,
  requestCrossPlatformNotificationPermission,
} from "@/lib/site";
import { toast } from "sonner";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    registerNotificationServiceWorker();
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem("quizboss-notif-dismissed")) return;
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const enable = async () => {
    const granted = await requestCrossPlatformNotificationPermission();
    setShow(false);
    if (granted) {
      try {
        await supabase.from("push_subscribers").insert({ device_id: getPlayer().id });
      } catch {
        // ignore if already subscribed
      }
      toast.success("Notifications activées sur ton appareil (Android / iOS / PC) 🔔");
    } else {
      localStorage.setItem("quizboss-notif-dismissed", "1");
    }
  };

  return (
    <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl border border-primary/30 bg-card p-3 animate-pop">
      <Bell className="h-5 w-5 shrink-0 text-primary animate-bounce" />
      <p className="text-xs font-semibold">
        Active les notifications (Android, iOS, Windows, Mac) pour recevoir les défis Duel en direct
        !
      </p>
      <Button size="sm" onClick={enable} className="ml-auto shrink-0">
        Activer 🔔
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
