import { useState, useCallback, useSyncExternalStore } from "react";
import { useProfile } from "./useProfile";

const DEV_KEY = "signal_leaf_dev_premium";

// Tiny external store for the dev override so multiple consumers stay in sync
function subscribeDevOverride(cb: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === DEV_KEY) cb();
  };
  window.addEventListener("storage", handler);
  // Also listen to a custom event for same-tab updates
  window.addEventListener("dev-premium-changed", cb);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("dev-premium-changed", cb);
  };
}

function getDevOverride() {
  try {
    return localStorage.getItem(DEV_KEY) === "true";
  } catch {
    return false;
  }
}

function setDevOverride(value: boolean) {
  localStorage.setItem(DEV_KEY, String(value));
  window.dispatchEvent(new Event("dev-premium-changed"));
}

const isDev = import.meta.env.DEV;

export function useSubscription() {
  const { data: profile, isLoading } = useProfile();
  const devOverride = useSyncExternalStore(subscribeDevOverride, getDevOverride, () => false);

  const dbPremium = profile?.is_premium ?? false;
  const isPremium = dbPremium || (isDev && devOverride);
  const tier: "free" | "premium" = isPremium ? "premium" : "free";

  return {
    tier,
    isPremium,
    isLoading,
    // Dev helpers
    isDev,
    devOverride: isDev ? devOverride : false,
    setDevOverride: isDev ? setDevOverride : undefined,
  };
}
