CREATE TABLE public.referrals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), referrer_id text NOT NULL, invitee_device text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT ON public.referrals TO anon, authenticated; GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone refer" ON public.referrals FOR INSERT TO anon, authenticated WITH CHECK (referrer_id <> invitee_device);
CREATE POLICY "anyone count" ON public.referrals FOR SELECT TO anon, authenticated USING (true);