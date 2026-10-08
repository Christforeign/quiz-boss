import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/site";

declare global { interface Window { adsbygoogle?: unknown[] } }

/** Ad slot: shows AdSense automatically once the publisher ID is set in Admin → Réglages. */
export function AdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  const { data } = useSettings();
  const client = data?.["adsense_client"]?.trim();
  const adSlot = data?.["adsense_slot"]?.trim();
  useEffect(() => {
    if (!client) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* not ready */ }
  }, [client]);
  if (client)
    return (
      <ins className={`adsbygoogle block min-h-[70px] ${className}`} style={{ display: "block" }}
        data-ad-client={client} data-ad-slot={adSlot || undefined} data-ad-format="auto" data-full-width-responsive="true" data-slot-name={slot} />
    );
  return (
    <div
      data-ad-slot={slot}
      className={`flex min-h-[70px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground ${className}`}
    >
      Publicité
    </div>
  );
}

export function LocalBanner({ placement }: { placement: string }) {
  const { data } = useQuery({
    queryKey: ["banners", placement],
    queryFn: async () => {
      const { data } = await supabase.from("banners").select("*").eq("active", true).eq("placement", placement);
      return data ?? [];
    },
  });
  const b = data?.[Math.floor(Date.now() / 60000) % Math.max(1, data?.length ?? 1)];
  if (!b) return null;
  const inner = (
    <div className="flex items-center gap-3 rounded-2xl bg-grad-sunset p-4 text-secondary-foreground shadow-lg animate-pop">
      {b.image_url && <img src={b.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" loading="lazy" />}
      <div className="min-w-0">
        <p className="font-bold leading-tight">{b.title}</p>
        {b.body && <p className="text-sm opacity-90">{b.body}</p>}
      </div>
      <span className="ml-auto text-[10px] uppercase opacity-70">Annonce</span>
    </div>
  );
  if (!b.link_url) return inner;
  return b.link_url.startsWith("/") ? (
    <Link to={b.link_url as "/"}>{inner}</Link>
  ) : (
    <a href={b.link_url} target="_blank" rel="noreferrer sponsored">{inner}</a>
  );
}
