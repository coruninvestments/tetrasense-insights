import {
  Moon,
  Flower2,
  Target,
  Palette,
  Brain,
  HeartPulse,
  Users,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";

export type GoalKey =
  | "sleep"
  | "relaxation"
  | "focus"
  | "creativity"
  | "learning"
  | "pain_relief"
  | "social"
  | "recreation";

export interface Goal {
  id: GoalKey;
  label: string;
  icon: LucideIcon;
}

export const GOALS: Goal[] = [
  { id: "sleep", label: "Sleep", icon: Moon },
  { id: "relaxation", label: "Relaxation", icon: Flower2 },
  { id: "focus", label: "Focus", icon: Target },
  { id: "creativity", label: "Creativity", icon: Palette },
  { id: "learning", label: "Learning", icon: Brain },
  { id: "pain_relief", label: "Pain Relief", icon: HeartPulse },
  { id: "social", label: "Social", icon: Users },
  { id: "recreation", label: "Recreation", icon: PartyPopper },
] as const;

export function getGoalIcon(goalKey: string): LucideIcon | null {
  return GOALS.find((g) => g.id === goalKey)?.icon ?? null;
}
