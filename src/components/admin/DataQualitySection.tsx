import { FounderMetricCard } from "./FounderMetricCard";
import { Progress } from "@/components/ui/progress";
import { Beaker, Leaf, BarChart3, Palette } from "lucide-react";
import type { FounderMetrics } from "@/lib/founderMetrics";

interface Props {
  metrics: FounderMetrics;
  loading: boolean;
}

function QualityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium text-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

export function DataQualitySection({ metrics: m, loading }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <FounderMetricCard label="Avg Completeness" value={`${m.dataQuality.avgCompleteness}%`} icon={<BarChart3 className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Avg Unique Products" value={m.dataQuality.avgUniqueProducts} sub="per active user" icon={<Leaf className="w-4 h-4 text-primary" />} loading={loading} />
        <FounderMetricCard label="Sensory Logging" value={`${m.dataQuality.pctSensory}%`} icon={<Palette className="w-4 h-4 text-primary" />} loading={loading} />
      </div>

      {!loading && (
        <div className="p-4 rounded-xl border bg-card space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Session Field Coverage</p>
          <QualityBar label="Dose data" value={m.dataQuality.pctDose} />
          <QualityBar label="Effect ratings" value={m.dataQuality.pctEffects} />
          <QualityBar label="Context fields" value={m.dataQuality.pctContext} />
          <QualityBar label="Flavor / Aroma" value={m.dataQuality.pctSensory} />
        </div>
      )}
    </div>
  );
}
