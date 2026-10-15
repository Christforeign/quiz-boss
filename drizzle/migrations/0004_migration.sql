CREATE OR REPLACE FUNCTION public.admin_adjust_coins(_user uuid, _delta integer, _set integer DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE newval integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles
    SET coins = GREATEST(0, COALESCE(_set, coins + _delta)), updated_at = now()
    WHERE id = _user RETURNING coins INTO newval;
  IF newval IS NULL THEN RAISE EXCEPTION 'profil introuvable'; END IF;
  RETURN newval;
END $$;
REVOKE ALL ON FUNCTION public.admin_adjust_coins(uuid, integer, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_coins(uuid, integer, integer) TO authenticated;