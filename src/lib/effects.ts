import {
  Flower2,
  Target,
  Zap,
  AlertTriangle,
  HeartPulse,
  Smile,
  Moon,
  Dumbbell,
  Droplets,
  Eye,
  Flame,
  type LucideIcon,
} from "lucide-react";

export type EffectKey =
  | "relaxation"
  | "focus"
  | "sleepiness"
  | "anxiety"
  | "pain_relief"
  | "euphoria"
  | "body_heaviness"
  | "dry_mouth"
  | "dry_eyes"
  | "throat_irritation";

export interface EffectDef {
  key: EffectKey;
  label: string;
  icon: LucideIcon;
}

/** Primary effects used on the Log Session effects step */
export const EFFECTS: EffectDef[] = [
  { key: "relaxation", label: "Relaxation", icon: Flower2 },
  { key: "focus", label: "Focus", icon: Target },
  { key: "sleepiness", label: "Energy", icon: Zap },
  { key: "anxiety", label: "Anxiety", icon: AlertTriangle },
  { key: "pain_relief", label: "Pain Relief", icon: HeartPulse },
  { key: "euphoria", label: "Mood", icon: Smile },
];

/** Extended effects used in calibration */
export const CALIBRATION_EFFECTS: EffectDef[] = [
  { key: "relaxation", label: "Relaxation", icon: Flower2 },
  { key: "anxiety", label: "Anxiety", icon: AlertTriangle },
  { key: "focus", label: "Focus", icon: Target },
  { key: "sleepiness", label: "Sleepiness", icon: Moon },
  { key: "body_heaviness", label: "Body Heaviness", icon: Dumbbell },
  { key: "dry_mouth", label: "Dry Mouth", icon: Droplets },
  { key: "dry_eyes", label: "Dry Eyes", icon: Eye },
  { key: "throat_irritation", label: "Throat Irritation", icon: Flame },
];

/** Effect drivers mapping (uses DB column names) */
export const EFFECT_DRIVER_KEYS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "effect_sleepiness", label: "Sleepiness", icon: Moon },
  { key: "effect_relaxation", label: "Relaxation", icon: Flower2 },
  { key: "effect_focus", label: "Focus", icon: Target },
  { key: "effect_pain_relief", label: "Pain Relief", icon: HeartPulse },
  { key: "effect_euphoria", label: "Euphoria", icon: Smile },
  { key: "effect_anxiety", label: "Anxiety", icon: AlertTriangle },
];

export function getEffectIcon(key: string): LucideIcon | null {
  return (
    EFFECTS.find((e) => e.key === key)?.icon ??
    CALIBRATION_EFFECTS.find((e) => e.key === key)?.icon ??
    null
  );
}
