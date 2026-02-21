-- Revoke EXECUTE on refresh_community_strain_stats from public roles
-- Only service_role (used by edge functions / server-side) should call this.
REVOKE EXECUTE ON FUNCTION public.refresh_community_strain_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_community_strain_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_community_strain_stats() FROM authenticated;