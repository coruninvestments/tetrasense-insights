-- Function to auto-grant founding_user achievement to first 50 users
CREATE OR REPLACE FUNCTION public.grant_founding_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  IF user_count <= 50 THEN
    INSERT INTO public.achievements (user_id, key)
    VALUES (NEW.user_id, 'founding_user')
    ON CONFLICT (user_id, key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_founding_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_founding_user();