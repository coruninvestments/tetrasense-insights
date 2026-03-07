import { ShieldCheck, ShieldQuestion, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { QualityResult } from "@/lib/productQuality";

const levelConfig = {
  "high quality": { icon: Sparkles, className: "bg-success/15 text-success", label: "High Quality" },
  good: { icon: ShieldCheck, className: "bg-primary/15 text-primary", label: "Good" },
  basic: { icon: ShieldCheck, className: "bg-muted text-muted-foreground", label: "Basic" },
  unknown: { icon: ShieldQuestion, className: "bg-muted text-muted-foreground", label: "Unknown" },
};

export function QualityScorePill({ result }: { result: QualityResult }) {
  const cfg = levelConfig[result.level];
  const Icon = cfg.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-help ${cfg.className}`}
          >
            <Icon className="w-3 h-3" />
            {result.level === "unknown" ? "Quality unknown" : `${result.qualityScore}`}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs space-y-1">
          <p className="font-medium">{cfg.label} Product</p>
          {result.reasons.map((r, i) => (
            <p key={i} className="text-muted-foreground">• {r}</p>
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function QualityScoreBreakdown({ result }: { result: QualityResult }) {
  const cfg = levelConfig[result.level];
  const Icon = cfg.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${cfg.className}`}>
          <Icon className="w-3.5 h-3.5" />
          {cfg.label}
          {result.level !== "unknown" && (
            <span className="ml-1 opacity-70">— {result.qualityScore}/100</span>
          )}
        </div>
      </div>
      <ul className="space-y-1.5">
        {result.reasons.map((r, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="mt-1 w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
