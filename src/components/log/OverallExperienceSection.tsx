export type OutcomePreference = "use_again" | "neutral" | "avoid";

interface Props {
  value: OutcomePreference | "";
  onChange: (value: OutcomePreference) => void;
}

const options: { id: OutcomePreference; emoji: string; label: string }[] = [
  { id: "use_again", emoji: "👍", label: "Would use again" },
  { id: "neutral", emoji: "😐", label: "Neutral" },
  { id: "avoid", emoji: "👎", label: "Avoid in future" },
];

export function OverallExperienceSection({ value, onChange }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Overall Experience
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl text-sm font-medium transition-colors ${
              value === opt.id
                ? "ring-2 ring-primary bg-primary/5"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-xs text-center leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
