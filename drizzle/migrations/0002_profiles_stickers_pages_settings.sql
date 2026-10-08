CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  coins int NOT NULL DEFAULT 0,
  xp int NOT NULL DEFAULT 0,
  games_played int NOT NULL DEFAULT 0,
  best_score int NOT NULL DEFAULT 0,
  referral_claimed int NOT NULL DEFAULT 0,
  device_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated; GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles(id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1))) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

ALTER TABLE public.questions ADD COLUMN image_url text;
ALTER TABLE public.withdrawals ADD COLUMN user_id uuid;

CREATE TABLE public.sticker_packs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, category text NOT NULL DEFAULT 'Humour', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.stickers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), pack_id uuid NOT NULL REFERENCES public.sticker_packs(id) ON DELETE CASCADE, image_url text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.custom_pages (slug text PRIMARY KEY, title text NOT NULL DEFAULT '', mode text NOT NULL DEFAULT 'image', html text, image_url text, body text, status text NOT NULL DEFAULT 'disabled', updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.app_settings (key text PRIMARY KEY, value text, updated_at timestamptz NOT NULL DEFAULT now());

DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['sticker_packs','stickers','custom_pages','app_settings'] LOOP
  EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
  EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "public read" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
  EXECUTE format('CREATE POLICY "admin write" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''))', t);
END LOOP; END $$;

CREATE POLICY "media public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'media');
CREATE POLICY "media admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "media admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "media admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));