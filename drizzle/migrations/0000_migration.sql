CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role app_role NOT NULL, UNIQUE(user_id, role));
GRANT SELECT ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- first registered user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin') THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE TABLE public.questions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), category text NOT NULL, question text NOT NULL, options text[] NOT NULL, correct_index int NOT NULL DEFAULT 0, lang text NOT NULL DEFAULT 'fr', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.quotes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL DEFAULT 'quote', content text NOT NULL, author text, emoji text, theme text NOT NULL DEFAULT 'sunset', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.banners (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, body text, image_url text, link_url text, placement text NOT NULL DEFAULT 'home', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.embeds (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, url text NOT NULL, description text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, body text NOT NULL, url text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.push_subscribers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), device_id text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.withdrawals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), player_id text NOT NULL, full_name text NOT NULL, contact text NOT NULL, method text NOT NULL, account text NOT NULL, amount int NOT NULL CHECK (amount > 0), level int NOT NULL, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now());

DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['questions','quotes','banners','embeds','notifications'] LOOP
  EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
  EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "public read" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
  EXECUTE format('CREATE POLICY "admin write" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''))', t);
END LOOP; END $$;

GRANT INSERT ON public.push_subscribers TO anon, authenticated; GRANT SELECT ON public.push_subscribers TO authenticated; GRANT ALL ON public.push_subscribers TO service_role;
ALTER TABLE public.push_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone subscribe" ON public.push_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin read subs" ON public.push_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

GRANT INSERT ON public.withdrawals TO anon, authenticated; GRANT SELECT, UPDATE, DELETE ON public.withdrawals TO authenticated; GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone request" ON public.withdrawals FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
CREATE POLICY "admin manage w" ON public.withdrawals FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.questions (category, question, options, correct_index, lang) VALUES
('musique','Quel artiste a chanté "Blinding Lights" ?',ARRAY['The Weeknd','Drake','Bruno Mars','Ed Sheeran'],0,'fr'),
('musique','Quel groupe haïtien est célèbre pour le compas "Ou se tout pou mwen" ?',ARRAY['Tabou Combo','Carimi','Kassav','T-Vice'],1,'fr'),
('musique','Sur TikTok, combien de secondes durait la vidéo maximale au lancement ?',ARRAY['15 s','60 s','3 min','10 min'],0,'fr'),
('musique','Ki chantè ki rele "Queen of Haitian music" ?',ARRAY['Rutshelle Guillaume','Fabienne Denis','Emeline Michel','Tifane'],2,'ht'),
('musique','Which artist released the album "Renaissance" in 2022?',ARRAY['Rihanna','Beyoncé','Adele','Dua Lipa'],1,'en'),
('musique','Quel instrument est central dans le rara haïtien ?',ARRAY['Vaksin','Violon','Harpe','Saxophone'],0,'fr'),
('musique','Quelle danse TikTok a rendu "Renegade" populaire ?',ARRAY['Une chorégraphie de Jalaiah Harmon','Un défi de cuisine','Un sketch','Un tuto maquillage'],0,'fr'),
('musique','Qui a chanté "Calm Down" avec Selena Gomez ?',ARRAY['Burna Boy','Rema','Wizkid','Davido'],1,'fr'),
('geographie','Quelle est la capitale d''Haïti ?',ARRAY['Cap-Haïtien','Port-au-Prince','Jacmel','Les Cayes'],1,'fr'),
('geographie','Quel est le plus long fleuve du monde ?',ARRAY['Amazone','Nil','Yangtsé','Mississippi'],1,'fr'),
('geographie','Ki pi wo mòn an Ayiti ?',ARRAY['Pic la Selle','Pic Macaya','Mòn Pele','Mòn Kabrit'],0,'ht'),
('geographie','Which country has the most population in 2024?',ARRAY['China','India','USA','Indonesia'],1,'en'),
('geographie','Avec quel pays Haïti partage-t-il l''île ?',ARRAY['Cuba','Jamaïque','République dominicaine','Porto Rico'],2,'fr'),
('geographie','Quelle est la capitale du Canada ?',ARRAY['Toronto','Montréal','Ottawa','Vancouver'],2,'fr'),
('geographie','Quel océan est le plus grand ?',ARRAY['Atlantique','Indien','Arctique','Pacifique'],3,'fr'),
('geographie','Dans quel pays se trouve Machu Picchu ?',ARRAY['Pérou','Bolivie','Chili','Mexique'],0,'fr'),
('culture','En quelle année Haïti a proclamé son indépendance ?',ARRAY['1791','1804','1825','1915'],1,'fr'),
('culture','Qui a peint la Joconde ?',ARRAY['Michel-Ange','Picasso','Léonard de Vinci','Raphaël'],2,'fr'),
('culture','Konbyen jou ki genyen nan yon ane bisèkstil ?',ARRAY['364','365','366','367'],2,'ht'),
('culture','What is the chemical symbol for gold?',ARRAY['Go','Gd','Au','Ag'],2,'en'),
('culture','Quel est le plat traditionnel haïtien du 1er janvier ?',ARRAY['Griot','Soup joumou','Diri djon djon','Lalo'],1,'fr'),
('culture','Combien de continents compte-t-on généralement ?',ARRAY['5','6','7','8'],2,'fr'),
('culture','Qui a écrit "Gouverneurs de la rosée" ?',ARRAY['Jacques Roumain','Dany Laferrière','Frankétienne','Jacques Stephen Alexis'],0,'fr'),
('culture','Quelle planète est surnommée la planète rouge ?',ARRAY['Vénus','Mars','Jupiter','Saturne'],1,'fr'),
('cinema','Qui joue Iron Man dans le MCU ?',ARRAY['Chris Evans','Robert Downey Jr.','Chris Hemsworth','Mark Ruffalo'],1,'fr'),
('cinema','Dans quelle série trouve-t-on "Winter is coming" ?',ARRAY['The Witcher','Vikings','Game of Thrones','The Crown'],2,'fr'),
('cinema','Which film won Best Picture at the 2020 Oscars?',ARRAY['1917','Joker','Parasite','Ford v Ferrari'],2,'en'),
('cinema','Quelle série Netflix coréenne met en scène des jeux mortels ?',ARRAY['Kingdom','Squid Game','All of Us Are Dead','Sweet Home'],1,'fr'),
('cinema','Ki fim Disney ki gen yon lyon ki rele Simba ?',ARRAY['Le Roi Lion','Aladdin','Tarzan','Moana'],0,'ht'),
('cinema','Qui a réalisé "Titanic" ?',ARRAY['Steven Spielberg','James Cameron','Christopher Nolan','Ridley Scott'],1,'fr'),
('cinema','Dans "La Casa de Papel", quel est le surnom du cerveau ?',ARRAY['Le Professeur','Berlin','Tokyo','Rio'],0,'fr'),
('cinema','Quel personnage dit "Je s''appelle Groot" ?',ARRAY['Rocket','Groot','Drax','Star-Lord'],1,'fr');

INSERT INTO public.quotes (kind, content, author, emoji, theme) VALUES
('quote','Le succès n''est pas final, l''échec n''est pas fatal : c''est le courage de continuer qui compte.','Winston Churchill','🔥','sunset'),
('quote','Piti piti zwazo fè nich li.','Pwovèb ayisyen','🐦','ocean'),
('motivation','Chaque matin est une nouvelle chance de devenir la meilleure version de toi-même.',NULL,'☀️','lime'),
('quote','Dèyè mòn gen mòn.','Pwovèb ayisyen','⛰️','night'),
('motivation','Ne compare pas ton chapitre 1 au chapitre 20 de quelqu''un d''autre.',NULL,'📖','candy'),
('quote','The best way to predict the future is to create it.','Peter Drucker','🚀','ocean'),
('sticker','Boss mode activé 😎',NULL,'😎','candy'),
('sticker','Pa janm bay legen 💪',NULL,'💪','lime'),
('motivation','Discipline > motivation. Fais-le même quand tu n''en as pas envie.',NULL,'⚡','night'),
('sticker','Bon nwit fanmi ❤️',NULL,'🌙','sunset');

INSERT INTO public.banners (title, body, link_url, placement) VALUES
('Gagne 2x plus de pièces ce week-end !','Joue au Mix Aléatoire et double tes gains.','/play/mix','home'),
('Invite tes amis','+50 pièces pour chaque ami invité.','/invite','result');

INSERT INTO public.embeds (title, url, description) VALUES
('2048','https://play2048.co/','Le célèbre jeu de puzzle'),
('Wikipedia FR','https://fr.wikipedia.org/wiki/Haïti','Apprends plus sur Haïti');