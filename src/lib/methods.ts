import {
  Flame,
  Wind,
  Cookie,
  Droplets,
  Hand,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type MethodKey = "smoke" | "vape" | "edible" | "tincture" | "topical" | "other";

export interface MethodDef {
  id: MethodKey;
  label: string;
  icon: LucideIcon;
}

export const METHODS: MethodDef[] = [
  { id: "smoke", label: "Smoke", icon: Flame },
  { id: "vape", label: "Vape", icon: Wind },
  { id: "edible", label: "Edible", icon: Cookie },
  { id: "tincture", label: "Tincture", icon: Droplets },
  { id: "topical", label: "Topical", icon: Hand },
  { id: "other", label: "Other", icon: Sparkles },
];

export function getMethodIcon(key: string): LucideIcon | null {
  return METHODS.find((m) => m.id === key)?.icon ?? null;
}
