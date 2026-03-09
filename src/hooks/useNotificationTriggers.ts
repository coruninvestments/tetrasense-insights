import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { evaluateNotificationTriggers } from "@/lib/notifications";

/**
 * Evaluates notification triggers once per session (on mount).
 * Place in a top-level layout so it runs when the user opens the app.
 */
export function useNotificationTriggers() {
  const { user } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (!user || ran.current) return;
    ran.current = true;

    // Small delay so the app loads first
    const timer = setTimeout(() => {
      evaluateNotificationTriggers(user.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [user]);
}
