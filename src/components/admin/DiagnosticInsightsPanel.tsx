import { DiagnosticInsight } from "@/lib/founderMetrics";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface Props {
  insights: DiagnosticInsight[];
}

const ICON_MAP = {
  info: Info,
  warn: AlertTriangle,
  good: CheckCircle,
};

const STYLE_MAP = {
  info: "bg-secondary/50 border-border text-foreground",
  warn: "bg-destructive/5 border-destructive/20 text-destructive",
  good: "bg-primary/5 border-primary/20 text-primary",
};

export function DiagnosticInsightsPanel({ insights }: Props) {
  if (insights.length === 0) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {insights.map((ins, i) => {
        const Icon = ICON_MAP[ins.severity];
        return (
          <div
            key={i}
            className={`flex items-start gap-2.5 p-3 rounded-lg border text-sm ${STYLE_MAP[ins.severity]}`}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="leading-snug">{ins.message}</span>
          </div>
        );
      })}
    </div>
  );
}
