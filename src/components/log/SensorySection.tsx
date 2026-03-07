import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

/* ── Tag definitions ─────────────────────────────────────────────── */

const AROMA_TAGS = [
  "citrus", "pine", "earthy", "floral", "sweet",
  "diesel", "herbal", "spicy", "fruity", "skunky", "creamy",
] as const;

const FLAVOR_TAGS = [
  "citrus", "pine", "earthy", "sweet", "peppery",
  "gassy", "berry", "woody", "minty", "tropical",
] as const;

const INHALE_OPTIONS = ["smooth", "moderate", "harsh"] as const;
const AFTERTASTE_OPTIONS = ["clean", "lingering", "bitter", "sweet", "earthy"] as const;

/* ── Data type ───────────────────────────────────────────────────── */

export interface SensoryData {
  aroma_tags: string[];
  flavor_tags: string[];
  inhale_quality: string | null;
  aftertaste: string | null;
  sensory_enjoyment: number | null;
}

export const emptySensory: SensoryData = {
  aroma_tags: [],
  flavor_tags: [],
  inhale_quality: null,
  aftertaste: null,
  sensory_enjoyment: null,
};

/* ── Chip component ──────────────────────────────────────────────── */

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

/* ── Main component ──────────────────────────────────────────────── */

interface SensorySectionProps {
  value: SensoryData;
  onChange: (data: SensoryData) => void;
}

export function SensorySection({ value, onChange }: SensorySectionProps) {
  const toggle = (field: "aroma_tags" | "flavor_tags", tag: string) => {
    const current = value[field];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    onChange({ ...value, [field]: next });
  };

  const setField = <K extends keyof SensoryData>(key: K, val: SensoryData[K]) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-5">
      {/* Aroma */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Aroma
        </p>
        <div className="flex flex-wrap gap-2">
          {AROMA_TAGS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              selected={value.aroma_tags.includes(tag)}
              onClick={() => toggle("aroma_tags", tag)}
            />
          ))}
        </div>
      </div>

      {/* Flavor */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Flavor
        </p>
        <div className="flex flex-wrap gap-2">
          {FLAVOR_TAGS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              selected={value.flavor_tags.includes(tag)}
              onClick={() => toggle("flavor_tags", tag)}
            />
          ))}
        </div>
      </div>

      {/* Inhale Quality */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Inhale Quality
        </p>
        <div className="flex gap-2">
          {INHALE_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={value.inhale_quality === opt}
              onClick={() =>
                setField("inhale_quality", value.inhale_quality === opt ? null : opt)
              }
            />
          ))}
        </div>
      </div>

      {/* Aftertaste */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Aftertaste
        </p>
        <div className="flex flex-wrap gap-2">
          {AFTERTASTE_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={value.aftertaste === opt}
              onClick={() =>
                setField("aftertaste", value.aftertaste === opt ? null : opt)
              }
            />
          ))}
        </div>
      </div>

      {/* Sensory Enjoyment */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sensory Enjoyment
          </p>
          {value.sensory_enjoyment !== null && (
            <span className="text-xs font-medium text-primary">
              {value.sensory_enjoyment}/5
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() =>
                setField(
                  "sensory_enjoyment",
                  value.sensory_enjoyment === n ? null : n
                )
              }
              className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${
                value.sensory_enjoyment !== null && value.sensory_enjoyment >= n
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          How much did you enjoy this product's sensory profile?
        </p>
      </div>
    </div>
  );
}
