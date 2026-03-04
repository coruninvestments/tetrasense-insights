import { useSyncExternalStore } from "react";
import { useProfile } from "./useProfile";
import { useIsAdmin } from "./useIsAdmin";

const DEV_KEY = "signal_leaf_dev_premium";
const isDev = import.meta.env.MODE !== "production";

function subscribeDevOverride(cb: () => void) {
  window.addEventListener("storage", (e) => { if (e.key === DEV_KEY) cb(); });
  window.addEventListener("dev-premium-changed", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("dev-premium-changed", cb);
  };
}

function getDevOverride() {
  try { return localStorage.getItem(DEV_KEY) === "true"; } catch { return false; }
}

function setDevOverride(value: boolean) {
  localStorage.setItem(DEV_KEY, String(value));
  window.dispatchEvent(new Event("dev-premium-changed"));
}

export function useSubscription() {
  const { data: profile, isLoading } = useProfile();
  const { isAdmin } = useIsAdmin();
  const rawDevOverride = useSyncExternalStore(subscribeDevOverride, getDevOverride, () => false);

  const canUseDevPremium = isDev && isAdmin;
  const devOverride = canUseDevPremium && rawDevOverride;

  const dbPremium = profile?.is_premium ?? false;
  const isPremium = dbPremium || devOverride;
  const tier: "free" | "premium" = isPremium ? "premium" : "free";

  return {
    tier,
    isPremium,
    isLoading,
    canUseDevPremium,
    devOverride,
    setDevOverride: canUseDevPremium ? setDevOverride : undefined,
  };
}
