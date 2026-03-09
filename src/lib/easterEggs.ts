import { supabase } from "@/integrations/supabase/client";
import type { SessionLog } from "@/hooks/useSessionLogs";
import { computeSignalStrength } from "@/lib/signalStrength";
import { computeConfidence } from "@/lib/confidenceEngine";
import { computeTerpenePreferences } from "@/lib/terpenePreferences";
import { computeLearningPath } from "@/lib/learningPath";

/* ── Types ───────────────────────────────────────────────────────── */

export type EasterEggKey =
  | "first_true_signal"
  | "flavor_memory"
  | "pattern_whisperer"
  | "constellation_reader"
  | "quiet_scholar"
  | "signal_alchemist";

export interface EasterEggDef {
  key: EasterEggKey;
  title: string;
  subtitle: string;
  glyph: string; // a subtle symbol, not an emoji
}

/** Only revealed after unlock — never list these publicly */
const EGG_DEFS: Record<EasterEggKey, EasterEggDef> = {
  first_true_signal: {
    key: "first_true_signal",
    title: "First True Signal",
    subtitle: "Your signal emerged from the noise",
    glyph: "◈",
  },
  flavor_memory: {
    key: "flavor_memory",
    title: "Flavor Memory",
    subtitle: "Your palate speaks in patterns",
    glyph: "◎",
  },
  pattern_whisperer: {
    key: "pattern_whisperer",
    title: "Pattern Whisperer",
    subtitle: "You read the data others miss",
    glyph: "⟡",
  },
  constellation_reader: {
    key: "constellation_reader",
    title: "Constellation Reader",
    subtitle: "Strong signal meets deep confidence",
    glyph: "✦",
  },
  quiet_scholar: {
    key: "quiet_scholar",
    title: "Quiet Scholar",
    subtitle: "Knowledge sharpens instinct",
    glyph: "◇",
  },
  signal_alchemist: {
    key: "signal_alchemist",
    title: "Signal Alchemist",
    subtitle: "Terpenes bend to your understanding",
    glyph: "⬡",
  },
};

/* ── Evaluation ──────────────────────────────────────────────────── */

export function getEggDef(key: EasterEggKey): EasterEggDef {
  return EGG_DEFS[key];
}

export function getUnlockedEggDefs(keys: string[]): EasterEggDef[] {
  return keys
    .filter((k): k is EasterEggKey => k in EGG_DEFS)
    .map((k) => EGG_DEFS[k]);
}

/**
 * Evaluate which easter eggs should unlock based on current user data.
 * Returns keys that are newly eligible (caller handles persistence).
 */
export function evaluateEasterEggs(
  sessions: SessionLog[],
  unlockedAchievementKeys: string[],
  completedModuleIds: string[],
): EasterEggKey[] {
  const eligible: EasterEggKey[] = [];
  const total = sessions.length;

  // ── First True Signal ──
  // ≥8 sessions, ≥60% with effects + dose + context
  if (total >= 8) {
    const highQuality = sessions.filter(
      (s) =>
        s.dose_level &&
        (s.effect_relaxation || s.effect_focus || s.effect_euphoria || s.effect_sleepiness || s.effect_pain_relief) &&
        (s.time_of_day || s.setting || s.mood_before)
    );
    if (highQuality.length / total >= 0.6) {
      eligible.push("first_true_signal");
    }
  }

  // ── Flavor Memory ──
  // ≥6 sessions with sensory data (aroma or flavor tags)
  const sensory = sessions.filter(
    (s) =>
      (s.aroma_tags && s.aroma_tags.length > 0) ||
      (s.flavor_tags && s.flavor_tags.length > 0)
  );
  if (sensory.length >= 6) {
    eligible.push("flavor_memory");
  }

  // ── Pattern Whisperer ──
  // ≥10 sessions + has viewed insights (first_insight_view achievement)
  if (total >= 10 && unlockedAchievementKeys.includes("first_insight_view")) {
    eligible.push("pattern_whisperer");
  }

  // ── Constellation Reader ──
  // Signal Strength ≥60 AND Confidence ≥60
  if (total >= 5) {
    const signal = computeSignalStrength(sessions);
    const confidence = computeConfidence(sessions);
    if (signal.score >= 60 && confidence.confidenceScore >= 60) {
      eligible.push("constellation_reader");
    }
  }

  // ── Quiet Scholar ──
  // ≥4 learning modules completed
  if (completedModuleIds.length >= 4) {
    eligible.push("quiet_scholar");
  }

  // ── Signal Alchemist ──
  // Terpene confidence reaches "high"
  if (total >= 5) {
    const terp = computeTerpenePreferences(sessions);
    if (terp.confidence === "high") {
      eligible.push("signal_alchemist");
    }
  }

  return eligible;
}

/* ── Persistence helpers ─────────────────────────────────────────── */

/**
 * Try to unlock an easter egg as an achievement.
 * Returns the key if newly unlocked, null if already had it.
 */
export async function tryUnlockEgg(key: EasterEggKey): Promise<EasterEggKey | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const eggKey = `egg_${key}`;
    const { error } = await supabase.from("achievements").insert({
      user_id: user.id,
      key: eggKey,
    } as any);

    if (error) return null; // unique constraint = already unlocked
    return key;
  } catch {
    return null;
  }
}

/**
 * Given current achievements, return which easter egg keys are unlocked.
 */
export function getUnlockedEggs(achievementKeys: string[]): EasterEggKey[] {
  return achievementKeys
    .filter((k) => k.startsWith("egg_"))
    .map((k) => k.replace("egg_", "") as EasterEggKey)
    .filter((k) => k in EGG_DEFS);
}
