import { motion } from "framer-motion";
import {
  Fingerprint, Leaf, Beaker, Target, AlertTriangle,
  Shield, BarChart3, Activity,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SignalFingerprint } from "@/lib/signalFingerprint";

interface StrainFingerprintModalProps {
  fingerprint: SignalFingerprint;
  open: boolean;
  onClose: () => void;
}

export function StrainFingerprintModal({
  fingerprint,
  open,
  onClose,
}: StrainFingerprintModalProps) {
  const isPreview = fingerprint.stage === "preview";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg">
                Your Strain Fingerprint
              </DialogTitle>
              {isPreview && (
                <Badge variant="outline" className="text-[10px] mt-1">
                  Preview — log {10 - fingerprint.sessionCount} more for full
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Identity */}
          <section className="text-center py-3 rounded-xl bg-secondary/30">
            <p className="font-serif text-xl font-medium text-foreground">
              {fingerprint.effectIdentity}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {fingerprint.effectSubtitle}
            </p>
          </section>

          {/* Key metrics */}
          <section className="grid grid-cols-3 gap-2">
            <MetricChip label="Clarity" value={`${fingerprint.clarityScore}%`} icon={Activity} />
            <MetricChip label="Confidence" value={fingerprint.confidenceLevel} icon={Shield} />
            <MetricChip
              label="Signal"
              value={fingerprint.signalStrengthLevel.replace(" Signal", "")}
              icon={BarChart3}
            />
          </section>

          {/* Terpenes */}
          {fingerprint.topTerpenes.length > 0 && (
            <section>
              <SectionLabel icon={Leaf} label="Top Terpene Signals" />
              <div className="space-y-2 mt-2">
                {fingerprint.topTerpenes.map((t) => (
                  <div key={t.name} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-28">{t.name}</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${t.score}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {t.score}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Dose & Method */}
          <section className="flex gap-3">
            {fingerprint.bestDoseRange !== "Gathering data" && (
              <div className="flex-1 p-3 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <Beaker className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] text-muted-foreground">Best Dose</span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {fingerprint.bestDoseRange}
                </p>
              </div>
            )}
            {fingerprint.preferredMethod && (
              <div className="flex-1 p-3 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] text-muted-foreground">Method</span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {fingerprint.preferredMethod}
                </p>
              </div>
            )}
          </section>

          {/* Genome summary */}
          {fingerprint.genomeSummary.length > 0 && (
            <section>
              <SectionLabel icon={BarChart3} label="Cannabis Genome" />
              <div className="space-y-2 mt-2">
                {fingerprint.genomeSummary.map((dim) => (
                  <div key={dim.label} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 text-right shrink-0">
                      {dim.label}
                    </span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(dim.value / 10) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground w-7 text-right">
                      {dim.value.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Risk signals */}
          {fingerprint.riskSignals.length > 0 && (
            <section>
              <SectionLabel icon={AlertTriangle} label="Watch Patterns" />
              <div className="space-y-1.5 mt-2">
                {fingerprint.riskSignals.map((risk, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{risk}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Explanatory note */}
          <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
            Your fingerprint reflects patterns from {fingerprint.sessionCount} sessions.
            It is not medical advice — it's your personal signal map.
          </p>

          {/* Share placeholder */}
          <Button variant="outline" size="sm" className="w-full" disabled>
            Share Fingerprint (coming soon)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Small helpers ────────────────────────────────────────────────── */

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-primary" />
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  );
}

function MetricChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="text-center p-2.5 rounded-xl bg-secondary/30 space-y-1">
      <Icon className="w-4 h-4 text-primary mx-auto" />
      <p className="text-sm font-medium text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
