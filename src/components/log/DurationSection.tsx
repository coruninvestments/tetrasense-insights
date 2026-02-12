export type DurationBucket = "lt_1h" | "1_2h" | "2_4h" | "4_6h" | "6p_h";

interface Props {
  value: DurationBucket | "";
  onChange: (value: DurationBucket) => void;
}

const options: { id: DurationBucket; label: string }[] = [
  { id: "lt_1h", label: "< 1 hr" },
  { id: "1_2h", label: "1–2 hrs" },
  { id: "2_4h", label: "2–4 hrs" },
  { id: "4_6h", label: "4–6 hrs" },
  { id: "6p_h", label: "6+ hrs" },
];

export function DurationSection({ value, onChange }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Duration
      </h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              value === opt.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
