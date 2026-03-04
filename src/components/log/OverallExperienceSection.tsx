import { ThumbsUp, Meh, ThumbsDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type OutcomePreference = "use_again" | "neutral" | "avoid";

interface Props {
  value: OutcomePreference | "";
  onChange: (value: OutcomePreference) => void;
}

const options: { id: OutcomePreference; icon: LucideIcon; label: string }[] = [
  { id: "use_again", icon: ThumbsUp, label: "Would use again" },
  { id: "neutral", icon: Meh, label: "Neutral" },
  { id: "avoid", icon: ThumbsDown, label: "Avoid in future" },
];

export function OverallExperienceSection({ value, onChange }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Overall Experience
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-sm font-medium transition-colors ${
                value === opt.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={2} />
              <span className="text-xs text-center leading-tight text-muted-foreground">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
