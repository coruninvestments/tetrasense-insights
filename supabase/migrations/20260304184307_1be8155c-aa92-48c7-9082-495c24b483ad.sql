
-- Trigger: prevent client-side updates to is_premium on profiles
-- Only service_role (used by edge functions) can modify is_premium
CREATE OR REPLACE FUNCTION public.protect_premium_field()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If is_premium is being changed and caller is not service_role, revert it
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    -- Check if current role is service_role (edge functions use this)
    IF current_setting('role', true) IS DISTINCT FROM 'service_role'
       AND current_setting('request.jwt.claims', true)::jsonb->>'role' IS DISTINCT FROM 'service_role' THEN
      NEW.is_premium := OLD.is_premium;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS trg_protect_premium ON public.profiles;
CREATE TRIGGER trg_protect_premium
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_premium_field();
