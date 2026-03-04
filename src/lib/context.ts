import {
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Home,
  TreePine,
  Users,
  Flower2,
  Building2,
  Droplets,
  Waves,
  CloudSun,
  Frown,
  Meh,
  SmilePlus,
  Coffee,
  type LucideIcon,
} from "lucide-react";

export interface ContextOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const TIME_OPTIONS: ContextOption[] = [
  { id: "morning", label: "Morning", icon: Sunrise },
  { id: "afternoon", label: "Afternoon", icon: Sun },
  { id: "evening", label: "Evening", icon: Sunset },
  { id: "night", label: "Night", icon: Moon },
];

export const SETTING_OPTIONS: ContextOption[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "outdoors", label: "Outdoors", icon: TreePine },
  { id: "social", label: "Social", icon: Users },
  { id: "alone", label: "Alone", icon: Flower2 },
  { id: "public", label: "Public", icon: Building2 },
];

export const STOMACH_OPTIONS: ContextOption[] = [
  { id: "empty", label: "Empty", icon: Meh },
  { id: "light", label: "Light", icon: SmilePlus },
  { id: "normal", label: "Normal", icon: SmilePlus },
  { id: "heavy", label: "Full", icon: SmilePlus },
];

export const HYDRATION_OPTIONS: ContextOption[] = [
  { id: "low", label: "Low", icon: CloudSun },
  { id: "ok", label: "OK", icon: Droplets },
  { id: "high", label: "Well", icon: Waves },
];

export const SLEEP_OPTIONS: ContextOption[] = [
  { id: "poor", label: "Poor", icon: Moon },
  { id: "ok", label: "OK", icon: Meh },
  { id: "good", label: "Good", icon: SmilePlus },
];

export const MOOD_OPTIONS: ContextOption[] = [
  { id: "low", label: "Low", icon: Frown },
  { id: "neutral", label: "Neutral", icon: Meh },
  { id: "good", label: "Good", icon: SmilePlus },
];

export const STRESS_OPTIONS: ContextOption[] = [
  { id: "low", label: "Low", icon: SmilePlus },
  { id: "medium", label: "Medium", icon: Meh },
  { id: "high", label: "High", icon: Frown },
];

export const CAFFEINE_ICON = Coffee;

/** Lookup any context option icon by field+id */
export function getContextIcon(field: string, id: string): LucideIcon | null {
  const map: Record<string, ContextOption[]> = {
    time_of_day: TIME_OPTIONS,
    setting: SETTING_OPTIONS,
    stomach: STOMACH_OPTIONS,
    hydration: HYDRATION_OPTIONS,
    sleep_quality: SLEEP_OPTIONS,
    mood_before: MOOD_OPTIONS,
    stress_before: STRESS_OPTIONS,
  };
  return map[field]?.find((o) => o.id === id)?.icon ?? null;
}
