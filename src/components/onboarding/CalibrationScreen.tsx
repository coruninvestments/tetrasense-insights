import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { HelpTip } from "@/components/guide/HelpTip";
import { useProfile, useUpdateProfile, CalibrationAnchors } from "@/hooks/useProfile";
import { toast } from "sonner";
import { CALIBRATION_EFFECTS } from "@/lib/effects";
import { BrandImage } from "@/components/brand/BrandImage";
import { ASSETS } from "@/lib/assets";

const categories = CALIBRATION_EFFECTS.map((e) => ({
  key: e.key,
  label: e.label,
  icon: e.icon,
  tipTitle: `${e.label} Scale`,
  tipDesc: `Define what 0 and 10 mean for ${e.label.toLowerCase()} in your personal experience.`,
}));

interface CalibrationScreenProps {
  onBack: () => void;
  embedded?: boolean;
}

export function CalibrationScreen({ onBack, embedded }: CalibrationScreenProps) {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const existing = (profile?.calibration_anchors || {}) as CalibrationAnchors;
  const [anchors, setAnchors] = useState<CalibrationAnchors>(() => {
    const init: CalibrationAnchors = {};
    categories.forEach((c) => {
      init[c.key] = {
        zero: existing[c.key]?.zero || "",
        ten: existing[c.key]?.ten || "",
      };
    });
    return init;
  });

  const updateAnchor = (key: string, end: "zero" | "ten", value: string) => {
    setAnchors((prev) => ({
      ...prev,
      [key]: { ...prev[key], [end]: value.slice(0, 80) },
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ calibration_anchors: anchors as any });
      toast.success("Calibration saved");
      if (!embedded) onBack();
    } catch {
      toast.error("Failed to save calibration");
    }
  };

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      {!embedded && (
        <header className="px-5 pt-12 pb-4 safe-top flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-medium text-foreground">
            Scale Calibration
          </h1>
        </header>
      )}

      <div className={embedded ? "space-y-4" : "px-5 pb-8 space-y-4"}>
        <p className="text-sm text-muted-foreground">
          Define what 0 and 10 mean for each effect. This keeps your ratings consistent over time.
        </p>

        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card variant="default" className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                  <span className="text-sm font-medium text-foreground flex-1">{cat.label}</span>
                  <HelpTip
                    id={`calibration_${cat.key}`}
                    title={cat.tipTitle}
                    description={cat.tipDesc}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">0 =</label>
                    <Input
                      value={anchors[cat.key]?.zero || ""}
                      onChange={(e) => updateAnchor(cat.key, "zero", e.target.value)}
                      placeholder="e.g. none at all"
                      className="text-xs h-8"
                      maxLength={80}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">10 =</label>
                    <Input
                      value={anchors[cat.key]?.ten || ""}
                      onChange={(e) => updateAnchor(cat.key, "ten", e.target.value)}
                      placeholder="e.g. max possible"
                      className="text-xs h-8"
                      maxLength={80}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? "Saving…" : "Save Calibration"}
        </Button>
      </div>
    </div>
  );
}
