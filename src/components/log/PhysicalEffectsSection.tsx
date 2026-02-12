import { EffectSlider } from "./EffectSlider";

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

const config = [
  { key: "dry_mouth" as const, label: "Dry Mouth", emoji: "💧" },
  { key: "dry_eyes" as const, label: "Dry / Red Eyes", emoji: "👁️" },
  { key: "throat_irritation" as const, label: "Throat Irritation", emoji: "🫁" },
  { key: "body_heaviness" as const, label: "Body Heaviness", emoji: "🏋️" },
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
            emoji={item.emoji}
            value={effects[item.key]}
            onChange={(v) => onChange(item.key, v)}
          />
        ))}
      </div>
    </div>
  );
}
