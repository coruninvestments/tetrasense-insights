import { Slider } from "@/components/ui/slider";

interface EffectSliderProps {
  label: string;
  emoji: string;
  value: number;
  onChange: (value: number) => void;
}

export function EffectSlider({ label, emoji, value, onChange }: EffectSliderProps) {
  const getIntensityLabel = (val: number) => {
    if (val === 0) return "None";
    if (val <= 3) return "Low";
    if (val <= 6) return "Medium";
    if (val <= 9) return "High";
    return "Max";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{getIntensityLabel(value)}</span>
          <span className="w-6 text-right text-sm font-semibold text-primary">{value}</span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        max={10}
        step={1}
        className="w-full"
      />
    </div>
  );
}
