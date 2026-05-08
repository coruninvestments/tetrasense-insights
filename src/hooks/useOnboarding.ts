import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import {
  ONBOARDING_VERSION,
  clearOnboardingCompletion,
  isOnboardingTutorialComplete,
  markOnboardingComplete,
} from "@/lib/onboarding";

interface UseOnboardingResult {
  /** True once we've checked storage. */
  ready: boolean;
  /** True if the tutorial should be shown right now. */
  shouldShow: boolean;
  /** Manually trigger replay. */
  replay: () => void;
  /** Mark complete and hide. */
  complete: () => void;
  /** Skip without marking complete? We still mark complete to avoid re-prompting. */
  skip: () => void;
  version: string;
}

/**
 * Tutorial onboarding state. Uses localStorage keyed per user id.
 * Independent from the legal/disclaimer onboarding gate.
 */
export function useOnboarding(): UseOnboardingResult {
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setReady(true);
      setShouldShow(false);
      return;
    }
    const done = isOnboardingTutorialComplete(user.id);
    setShouldShow(!done);
    setReady(true);
  }, [user, loading]);

  const complete = useCallback(() => {
    markOnboardingComplete(user?.id);
    setShouldShow(false);
  }, [user?.id]);

  const skip = useCallback(() => {
    markOnboardingComplete(user?.id);
    setShouldShow(false);
  }, [user?.id]);

  const replay = useCallback(() => {
    clearOnboardingCompletion(user?.id);
    setShouldShow(true);
  }, [user?.id]);

  return { ready, shouldShow, replay, complete, skip, version: ONBOARDING_VERSION };
}
