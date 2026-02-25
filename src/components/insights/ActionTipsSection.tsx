import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffectDrivers } from "@/hooks/useEffectDrivers";

interface TipGroup {
  label: string;
  emoji: string;
  tips: string[];
}

function deriveTips(
  positiveDrivers: { key: string }[],
  negativeDrivers: { key: string }[]
): TipGroup[] {
  const groups: TipGroup[] = [];
  const posKeys = new Set(positiveDrivers.map((d) => d.key));
  const negKeys = new Set(negativeDrivers.map((d) => d.key));

  if (negKeys.has("effect_anxiety")) {
    groups.push({
      label: "Managing anxiety",
      emoji: "😰",
      tips: [
        "Try a lower dose next time",
        "Avoid stimulant-leaning sessions for this intent",
        "Choose methods that give more control over dose",
        "Log notes on setting and hydration",
      ],
    });
  }

  if (posKeys.has("effect_focus")) {
    groups.push({
      label: "Leveraging focus",
      emoji: "🎯",
      tips: [
        "Choose sessions that produce focus and calm",
        "Replicate your best method and timing",
      ],
    });
  }

  if (posKeys.has("effect_relaxation")) {
    groups.push({
      label: "Leveraging relaxation",
      emoji: "🧘",
      tips: [
        "Lean into sessions that produce deep relaxation",
        "Replicate your best method and timing",
      ],
    });
  }

  if (posKeys.has("effect_sleepiness")) {
    groups.push({
      label: "Optimizing for sleep",
      emoji: "😴",
      tips: [
        "Schedule these sessions close to bedtime",
        "Pair with a calm setting for best results",
      ],
    });
  }

  if (negKeys.has("effect_sleepiness") && !posKeys.has("effect_sleepiness")) {
    groups.push({
      label: "Avoiding unwanted drowsiness",
      emoji: "💤",
      tips: [
        "Try a different strain or lower dose for daytime use",
        "Switch to methods with faster onset for more control",
      ],
    });
  }

  if (posKeys.has("effect_euphoria")) {
    groups.push({
      label: "Maximizing enjoyment",
      emoji: "✨",
      tips: [
        "Note what strains and methods produce this feeling",
        "Keep dose consistent — more isn't always better",
      ],
    });
  }

  return groups;
}

export function ActionTipsSection() {
  const { data, isLoading } = useEffectDrivers();

  if (isLoading || !data.hasEnoughData) return null;

  const tips = deriveTips(data.positiveDrivers, data.negativeDrivers);
  if (tips.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Action Tips</span>
          </div>
          <div className="space-y-4">
            {tips.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  {group.emoji} {group.label}
                </p>
                <ul className="space-y-1">
                  {group.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Based on your session patterns — not medical advice.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
