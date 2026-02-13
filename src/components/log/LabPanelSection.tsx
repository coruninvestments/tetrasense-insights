import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LabPanelCustomEntry } from "@/hooks/useProductBatches";

const COMMON_COMPOUNDS_SHORT = [
  "THCa", "THC", "CBDa", "CBD", "CBG", "CBN", "Total Terpenes",
];

const COMMON_COMPOUNDS_EXTENDED = [
  "CBC", "THCv", "Δ8", "Δ10", "HHC", "THCp",
];

interface LabPanelSectionProps {
  commonValues: Record<string, number>;
  onCommonChange: (values: Record<string, number>) => void;
  customEntries: LabPanelCustomEntry[];
  onCustomChange: (entries: LabPanelCustomEntry[]) => void;
}

export function LabPanelSection({
  commonValues,
  onCommonChange,
  customEntries,
  onCustomChange,
}: LabPanelSectionProps) {
  const [showMore, setShowMore] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [newCompound, setNewCompound] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newUnit, setNewUnit] = useState<LabPanelCustomEntry["unit"]>("%");

  const handleCommonValueChange = (compound: string, val: string) => {
    const num = parseFloat(val);
    if (val === "" || val === ".") {
      const next = { ...commonValues };
      delete next[compound];
      onCommonChange(next);
    } else if (!isNaN(num)) {
      onCommonChange({ ...commonValues, [compound]: num });
    }
  };

  const addCustomEntry = () => {
    if (!newCompound.trim() || !newValue.trim()) return;
    const num = parseFloat(newValue);
    if (isNaN(num)) return;
    onCustomChange([
      ...customEntries,
      { compound: newCompound.trim(), value: num, unit: newUnit },
    ]);
    setNewCompound("");
    setNewValue("");
    setAddingCustom(false);
  };

  const removeCustomEntry = (idx: number) => {
    onCustomChange(customEntries.filter((_, i) => i !== idx));
  };

  const allCompounds = showMore
    ? [...COMMON_COMPOUNDS_SHORT, ...COMMON_COMPOUNDS_EXTENDED]
    : COMMON_COMPOUNDS_SHORT;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Lab Panel
      </h4>

      {/* Common compounds */}
      <div className="space-y-3">
        {allCompounds.map((compound) => (
          <div key={compound} className="flex items-center gap-3">
            <span className="text-sm text-foreground w-28 shrink-0">{compound}</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="—"
              value={commonValues[compound] ?? ""}
              onChange={(e) => handleCommonValueChange(compound, e.target.value)}
              className="h-9 w-24"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        ))}
      </div>

      {/* Show more toggle */}
      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
        className="flex items-center gap-1 text-sm text-primary hover:underline"
      >
        {showMore ? (
          <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
        ) : (
          <>Show more compounds <ChevronDown className="w-3.5 h-3.5" /></>
        )}
      </button>

      {/* Custom entries */}
      {customEntries.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Custom</span>
          {customEntries.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="flex-1 text-foreground">{entry.compound}</span>
              <span className="text-muted-foreground">
                {entry.value} {entry.unit === "mg_g" ? "mg/g" : entry.unit}
              </span>
              <button
                type="button"
                onClick={() => removeCustomEntry(idx)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add compound */}
      {addingCustom ? (
        <div className="space-y-2 p-3 rounded-xl bg-secondary">
          <Input
            placeholder="Compound name"
            value={newCompound}
            onChange={(e) => setNewCompound(e.target.value)}
            className="h-9"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="h-9 flex-1"
            />
            <Select value={newUnit} onValueChange={(v) => setNewUnit(v as LabPanelCustomEntry["unit"])}>
              <SelectTrigger className="h-9 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="%">%</SelectItem>
                <SelectItem value="mg_g">mg/g</SelectItem>
                <SelectItem value="mg">mg</SelectItem>
                <SelectItem value="ppm">ppm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddingCustom(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={addCustomEntry} className="flex-1" disabled={!newCompound.trim() || !newValue.trim()}>
              Add
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingCustom(true)}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Add compound
        </button>
      )}
    </div>
  );
}
