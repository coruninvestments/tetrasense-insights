import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export interface SessionContext {
  time_of_day: string | null;
  setting: string | null;
  stomach: string | null;
  caffeine: boolean;
  hydration: string | null;
  sleep_quality: string | null;
  mood_before: string | null;
  stress_before: string | null;
}

export const emptyContext: SessionContext = {
  time_of_day: null,
  setting: null,
  stomach: null,
  caffeine: false,
  hydration: null,
  sleep_quality: null,
  mood_before: null,
  stress_before: null,
};

interface ChipGroupProps {
  label: string;
  options: { id: string; label: string; emoji?: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
}

function ChipGroup({ label, options, value, onChange }: ChipGroupProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(value === o.id ? null : o.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              value === o.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.emoji && <span className="mr-1">{o.emoji}</span>}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const timeOptions = [
  { id: "morning", label: "Morning", emoji: "🌅" },
  { id: "afternoon", label: "Afternoon", emoji: "☀️" },
  { id: "evening", label: "Evening", emoji: "🌆" },
  { id: "night", label: "Night", emoji: "🌙" },
];

const settingOptions = [
  { id: "home", label: "Home", emoji: "🏠" },
  { id: "outdoors", label: "Outdoors", emoji: "🌳" },
  { id: "social", label: "Social", emoji: "👥" },
  { id: "alone", label: "Alone", emoji: "🧘" },
  { id: "public", label: "Public", emoji: "🏙️" },
];

const stomachOptions = [
  { id: "empty", label: "Empty" },
  { id: "light", label: "Light" },
  { id: "normal", label: "Normal" },
  { id: "heavy", label: "Full" },
];

const hydrationOptions = [
  { id: "low", label: "Low", emoji: "🏜️" },
  { id: "ok", label: "OK", emoji: "💧" },
  { id: "high", label: "Well", emoji: "🌊" },
];

const sleepOptions = [
  { id: "poor", label: "Poor", emoji: "😴" },
  { id: "ok", label: "OK", emoji: "😐" },
  { id: "good", label: "Good", emoji: "😊" },
];

const moodOptions = [
  { id: "low", label: "Low", emoji: "😔" },
  { id: "neutral", label: "Neutral", emoji: "😐" },
  { id: "good", label: "Good", emoji: "😊" },
];

const stressOptions = [
  { id: "low", label: "Low", emoji: "😌" },
  { id: "medium", label: "Medium", emoji: "😐" },
  { id: "high", label: "High", emoji: "😤" },
];

interface ContextSectionProps {
  value: SessionContext;
  onChange: (ctx: SessionContext) => void;
}

export function ContextSection({ value, onChange, defaultOpen = false }: ContextSectionProps & { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  const update = <K extends keyof SessionContext>(key: K, v: SessionContext[K]) => {
    onChange({ ...value, [key]: v });
  };

  const filledCount = Object.entries(value).filter(
    ([k, v]) => k === "caffeine" ? v === true : v != null
  ).length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left"
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Context
        </h3>
        {filledCount > 0 && (
          <span className="text-[10px] font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">
            {filledCount}
          </span>
        )}
        <span className="ml-auto text-muted-foreground">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-5">
          <ChipGroup
            label="Time of day"
            options={timeOptions}
            value={value.time_of_day}
            onChange={(v) => update("time_of_day", v)}
          />
          <ChipGroup
            label="Setting"
            options={settingOptions}
            value={value.setting}
            onChange={(v) => update("setting", v)}
          />
          <ChipGroup
            label="Stomach"
            options={stomachOptions}
            value={value.stomach}
            onChange={(v) => update("stomach", v)}
          />
          <ChipGroup
            label="Hydration"
            options={hydrationOptions}
            value={value.hydration}
            onChange={(v) => update("hydration", v)}
          />
          <ChipGroup
            label="Sleep quality (last night)"
            options={sleepOptions}
            value={value.sleep_quality}
            onChange={(v) => update("sleep_quality", v)}
          />
          <ChipGroup
            label="Mood before"
            options={moodOptions}
            value={value.mood_before}
            onChange={(v) => update("mood_before", v)}
          />
          <ChipGroup
            label="Stress level"
            options={stressOptions}
            value={value.stress_before}
            onChange={(v) => update("stress_before", v)}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">☕ Had caffeine today?</span>
            <Switch
              checked={value.caffeine}
              onCheckedChange={(v) => update("caffeine", v)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
