import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { LucideIcon } from "lucide-react";
import {
  TIME_OPTIONS,
  SETTING_OPTIONS,
  STOMACH_OPTIONS,
  HYDRATION_OPTIONS,
  SLEEP_OPTIONS,
  MOOD_OPTIONS,
  STRESS_OPTIONS,
  CAFFEINE_ICON,
  type ContextOption,
} from "@/lib/context";

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
  options: ContextOption[];
  value: string | null;
  onChange: (v: string | null) => void;
}

function ChipGroup({ label, options, value, onChange }: ChipGroupProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const Icon = o.icon;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(value === o.id ? null : o.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                value === o.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ContextSectionProps {
  value: SessionContext;
  onChange: (ctx: SessionContext) => void;
}

export function ContextSection({ value, onChange, defaultOpen = false }: ContextSectionProps & { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const CaffeineIcon = CAFFEINE_ICON;

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
          <ChipGroup label="Time of day" options={TIME_OPTIONS} value={value.time_of_day} onChange={(v) => update("time_of_day", v)} />
          <ChipGroup label="Setting" options={SETTING_OPTIONS} value={value.setting} onChange={(v) => update("setting", v)} />
          <ChipGroup label="Stomach" options={STOMACH_OPTIONS} value={value.stomach} onChange={(v) => update("stomach", v)} />
          <ChipGroup label="Hydration" options={HYDRATION_OPTIONS} value={value.hydration} onChange={(v) => update("hydration", v)} />
          <ChipGroup label="Sleep quality (last night)" options={SLEEP_OPTIONS} value={value.sleep_quality} onChange={(v) => update("sleep_quality", v)} />
          <ChipGroup label="Mood before" options={MOOD_OPTIONS} value={value.mood_before} onChange={(v) => update("mood_before", v)} />
          <ChipGroup label="Stress level" options={STRESS_OPTIONS} value={value.stress_before} onChange={(v) => update("stress_before", v)} />

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CaffeineIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Had caffeine today?
            </span>
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
