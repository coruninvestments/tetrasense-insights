import { useState } from "react";
import { Plus, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EffectSlider } from "./EffectSlider";
import type { CustomEffectDef } from "@/hooks/useCustomEffects";

interface CustomEffectValue {
  name: string;
  value: number;
}

interface Props {
  definitions: CustomEffectDef[];
  values: CustomEffectValue[];
  onValuesChange: (values: CustomEffectValue[]) => void;
  onAddEffect: (name: string) => void;
}

export function CustomEffectsSection({ definitions, values, onValuesChange, onAddEffect }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  const getValue = (name: string) => values.find((v) => v.name === name)?.value ?? 0;

  const updateValue = (name: string, value: number) => {
    const existing = values.find((v) => v.name === name);
    if (existing) {
      onValuesChange(values.map((v) => (v.name === name ? { ...v, value } : v)));
    } else {
      onValuesChange([...values, { name, value }]);
    }
  };

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddEffect(trimmed);
    setNewName("");
    setShowAdd(false);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Custom Effects
      </h3>

      {definitions.length > 0 && (
        <div className="space-y-5 mb-4">
          {definitions.map((def) => (
            <EffectSlider
              key={def.name}
              label={def.name}
              icon={Zap}
              value={getValue(def.name)}
              onChange={(v) => updateValue(def.name, v)}
            />
          ))}
        </div>
      )}

      {showAdd ? (
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Effect name"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <Button size="sm" variant="default" onClick={handleAdd} disabled={!newName.trim()}>
            Save
          </Button>
          <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-full hover:bg-secondary">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdd(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Custom Effect
        </Button>
      )}
    </div>
  );
}
