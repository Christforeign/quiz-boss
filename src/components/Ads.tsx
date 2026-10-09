import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/site";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function useActiveBanners() {
  return useQuery({
    queryKey: ["banners", "all-active"],
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
}

function FlyerCard({
  b,
  className = "",
}: {
  b: {
    id: string;
    title: string;
    body: string | null;
    image_url: string | null;
    link_url: string | null;
  };
  className?: string;
}) {
  // Si la bannière a une grande image (flyer) sans texte ou avec titre court, afficher le flyer complet
  const isFullFlyer = Boolean(b.image_url && (!b.body || b.body.trim().length === 0));

  const inner = isFullFlyer ? (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg animate-pop ${className}`}
    >
      <img
        src={b.image_url!}
        alt={b.title || "Flyer"}
        className="max-h-72 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        loading="lazy"
      />
      {b.title && b.title.trim() !== "-" && (
        <div className="flex items-center justify-between bg-card/90 px-4 py-2.5 text-sm font-bold backdrop-blur-sm">
          <span>{b.title}</span>
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] uppercase text-primary">
            Découvrir
          </span>
        </div>
      )}
    </div>
  ) : (
    <div
      className={`flex items-center gap-3 rounded-2xl bg-grad-sunset p-4 text-secondary-foreground shadow-lg animate-pop ${className}`}
    >
      {b.image_url && (
        <img
          src={b.image_url}
          alt={b.title}
          className="h-16 w-16 shrink-0 rounded-xl object-cover shadow"
          loading="lazy"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-extrabold leading-tight">{b.title}</p>
        {b.body && <p className="mt-0.5 text-xs font-medium opacity-95">{b.body}</p>}
      </div>
      <span className="ml-auto shrink-0 rounded-full bg-background/20 px-2.5 py-1 text-[10px] font-bold uppercase">
        Info
      </span>
    </div>
  );

  if (!b.link_url) return inner;
  return b.link_url.startsWith("/") ? (
    <Link to={b.link_url as "/"} className="block">
      {inner}
    </Link>
  ) : (
    <a href={b.link_url} target="_blank" rel="noreferrer sponsored" className="block">
      {inner}
    </a>
  );
}

/**
 * Emplacement Bannières / Flyers / AdSense :
 * Affiche en priorité les Flyers et Bannières personnalisés (images, promos, annonces)
 * ou les blocs AdSense configurés.
 */
export function AdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  const { data: settings } = useSettings();
  const { data: banners = [] } = useActiveBanners();
  const client = settings?.["adsense_client"]?.trim();
  const adSlot = settings?.["adsense_slot"]?.trim();

  const matchingBanners = banners.filter(
    (b) =>
      b.placement === slot ||
      b.placement === "all" ||
      (slot === "home-bottom" && b.placement === "home"),
  );
  const fallbackBanners = matchingBanners.length > 0 ? matchingBanners : banners;

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (fallbackBanners.length <= 1) return;
    setIdx(Math.floor(Date.now() / 45000) % fallbackBanners.length);
  }, [fallbackBanners.length]);

  useEffect(() => {
    if (!client) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* not ready */
    }
  }, [client]);

  if (matchingBanners.length > 0) {
    const chosen = matchingBanners[idx % matchingBanners.length]!;
    return <FlyerCard b={chosen} className={className} />;
  }

  if (client) {
    return (
      <ins
        className={`adsbygoogle block min-h-[70px] ${className}`}
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={adSlot || undefined}
        data-ad-format="auto"
        data-full-width-responsive="true"
        data-slot-name={slot}
      />
    );
  }

  if (fallbackBanners.length > 0) {
    const chosen = fallbackBanners[idx % fallbackBanners.length]!;
    return <FlyerCard b={chosen} className={className} />;
  }

  return null;
}

export function LocalBanner({ placement }: { placement: string }) {
  const { data: banners = [] } = useActiveBanners();
  const matching = banners.filter((b) => b.placement === placement || b.placement === "all");
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (matching.length <= 1) return;
    setIdx(Math.floor(Date.now() / 60000) % matching.length);
  }, [matching.length]);

  const b = matching[idx % Math.max(1, matching.length)];
  if (!b) return null;
  return <FlyerCard b={b} />;
}
