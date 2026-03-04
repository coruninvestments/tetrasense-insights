import { Droplets, Eye, Wind, Dumbbell } from "lucide-react";
import { EffectSlider } from "./EffectSlider";
import type { LucideIcon } from "lucide-react";

export interface PhysicalEffects {
  dry_mouth: number;
  dry_eyes: number;
  throat_irritation: number;
  body_heaviness: number;
}

interface Props {
  effects: PhysicalEffects;
  onChange: (key: keyof PhysicalEffects, value: number) => void;
}

const config: { key: keyof PhysicalEffects; label: string; icon: LucideIcon }[] = [
  { key: "dry_mouth", label: "Dry Mouth", icon: Droplets },
  { key: "dry_eyes", label: "Dry / Red Eyes", icon: Eye },
  { key: "throat_irritation", label: "Throat Irritation", icon: Wind },
  { key: "body_heaviness", label: "Body Heaviness", icon: Dumbbell },
];

export function PhysicalEffectsSection({ effects, onChange }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Physical Effects (Optional)
      </h3>
      <div className="space-y-5">
        {config.map((item) => (
          <EffectSlider
            key={item.key}
            label={item.label}
            icon={item.icon}
            value={effects[item.key]}
            onChange={(v) => onChange(item.key, v)}
          />
        ))}
      </div>
    </div>
  );
}
