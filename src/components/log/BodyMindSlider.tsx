import { Slider } from "@/components/ui/slider";

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function BodyMindSlider({ value, onChange }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Body vs Mind
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>🧘 Body</span>
          <span>🧠 Mind</span>
        </div>
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          max={10}
          step={1}
          className="w-full"
        />
        <div className="text-center">
          <span className="text-sm font-semibold text-primary">{value}</span>
          <span className="text-xs text-muted-foreground ml-1">/ 10</span>
        </div>
      </div>
    </div>
  );
}
