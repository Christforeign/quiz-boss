import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SETTING_KEYS = [
  { key: "whatsapp_support", label: "Numéro WhatsApp support (ex: 50937000000)" },
  { key: "whatsapp_channel", label: "Lien de la chaîne WhatsApp officielle" },
  { key: "adsense_client", label: "ID éditeur AdSense (ca-pub-…)" },
  { key: "adsense_slot", label: "ID de bloc d'annonce AdSense (optionnel)" },
  { key: "head_script", label: "Script personnalisé (HTML collé dans la page : pixel, régie partenaire…)" },
] as const;

export const PAGE_SLOTS = [
  { slug: "page-1", label: "Page libre 1" },
  { slug: "page-2", label: "Page libre 2" },
  { slug: "page-3", label: "Page libre 3" },
  { slug: "page-4", label: "Page libre 4" },
  { slug: "page-5", label: "Page libre 5" },
  { slug: "conditions", label: "Conditions d'utilisation" },
  { slug: "faq", label: "FAQ" },
] as const;

export const PAGE_STATUS = [
  { id: "active", label: "Active" },
  { id: "coming_soon", label: "Bientôt disponible" },
  { id: "maintenance", label: "Maintenance en cours" },
  { id: "disabled", label: "Désactivée" },
] as const;

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("key,value");
      return Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""])) as Record<string, string>;
    },
  });
}

export function usePages() {
  return useQuery({
    queryKey: ["custom_pages"],
    queryFn: async () => (await supabase.from("custom_pages").select("*")).data ?? [],
  });
}

/** Admin-only: upload a file to private storage and return a long-lived signed URL. */
export async function uploadMedia(file: File, folder: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error("URL error");
  return data.signedUrl;
}
