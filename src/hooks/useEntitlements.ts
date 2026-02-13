import { useProfile } from "./useProfile";

export function useEntitlements() {
  const { data: profile, isLoading } = useProfile();
  return {
    isPremium: profile?.is_premium ?? false,
    isLoading,
  };
}
