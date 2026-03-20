import { Zap, Beaker, Pill, Gauge, TrendingUp, ShieldAlert, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getMatchColor, getMatchBgColor, getMatchLabel, type SignalMatchResult } from "@/lib/signalMatchEngine";

interface SignalMatchDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: SignalMatchResult | null;
  productName?: string;
}

const breakdownItems = [
  { key: "terpeneScore" as const, label: "Terpene Match", max: 40, icon: Beaker, desc: "How well batch terpenes align with your preferences" },
  { key: "cannabinoidScore" as const, label: "Cannabinoid Match", max: 20, icon: Pill, desc: "THC/CBD balance vs your outcome patterns" },
  { key: "intensityScore" as const, label: "Intensity Alignment", max: 20, icon: Gauge, desc: "Batch strength vs your preferred range" },
  { key: "outcomeScore" as const, label: "Outcome Reinforcement", max: 10, icon: TrendingUp, desc: "Positive outcome history correlation" },
];

export function SignalMatchDetailModal({ open, onOpenChange, match, productName }: SignalMatchDetailModalProps) {
  if (!match || !match.ready) return null;

  const colorClass = getMatchColor(match.score);
  const bgClass = getMatchBgColor(match.score);
  const label = getMatchLabel(match.score);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            Why this matches you
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Overall score */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${bgClass}`}>
              <span className={`text-2xl font-bold ${colorClass}`}>{match.score}</span>
            </div>
            <div>
              {productName && <p className="text-sm font-medium text-foreground">{productName}</p>}
              <p className={`text-sm font-medium ${colorClass}`}>{label}</p>
              <Badge variant="outline" className="mt-1 text-[10px]">
                {match.confidence} confidence
              </Badge>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            {breakdownItems.map(item => {
              const value = match.breakdown[item.key];
              const pct = (value / item.max) * 100;
              const Icon = item.icon;
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-foreground">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {value}/{item.max}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}

            {/* Risk penalty */}
            {match.breakdown.riskPenalty < 0 && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10">
                <ShieldAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-destructive">Risk penalty: {match.breakdown.riskPenalty}</p>
                  {match.reasons
                    .filter(r => r.includes("anxiety") || r.includes("mixed results"))
                    .map((r, i) => (
                      <p key={i} className="text-[10px] text-destructive/80 mt-0.5">{r}</p>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Reasons */}
          {match.reasons.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Info className="w-3 h-3" /> Match signals
              </p>
              {match.reasons.map((r, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {r}</p>
              ))}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground italic pt-2 border-t border-border">
            Match scores are based on your personal session data and verified batch chemistry.
            They improve as you log more sessions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
