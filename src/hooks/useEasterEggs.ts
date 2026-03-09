import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { useAchievements } from "@/hooks/useAchievements";
import { evaluateEasterEggs, tryUnlockEgg, getUnlockedEggs, type EasterEggKey } from "@/lib/easterEggs";
import { computeLearningPath } from "@/lib/learningPath";
import { EasterEggUnlockToast } from "@/components/profile/EasterEggUnlockToast";

export function useEasterEggs() {
  const { user } = useAuth();
  const { data: sessions } = useSessionLogs();
  const { data: achievements } = useAchievements();
  const evaluated = useRef(false);
  const [newUnlock, setNewUnlock] = useState<EasterEggKey | null>(null);

  const dismissUnlock = useCallback(() => setNewUnlock(null), []);

  useEffect(() => {
    if (!user || !sessions || !achievements || evaluated.current) return;
    if (sessions.length < 5) return; // don't evaluate too early
    evaluated.current = true;

    const run = async () => {
      const achievementKeys = achievements.map((a) => a.key);
      const alreadyUnlocked = getUnlockedEggs(achievementKeys);

      // Derive completed learning modules
      const learningPath = computeLearningPath(sessions);
      const completedModuleIds = learningPath.modules
        .filter((m) => m.status === "completed")
        .map((m) => m.id);

      const eligible = evaluateEasterEggs(sessions, achievementKeys, completedModuleIds);

      // Filter out already unlocked
      const newEggs = eligible.filter((k) => !alreadyUnlocked.includes(k));

      // Try to unlock the first new one (one at a time for delight)
      for (const egg of newEggs) {
        const result = await tryUnlockEgg(egg);
        if (result) {
          setNewUnlock(result);
          break;
        }
      }
    };

    run();
  }, [user, sessions, achievements]);

  return { newUnlock, dismissUnlock, Toast: EasterEggUnlockToast };
}
