import { motion, AnimatePresence } from "framer-motion";
import { Award, ChevronRight, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { SignalReportCard } from "@/lib/calibrationChallenge";
import type { GenomeDimension } from "@/lib/cannabisGenome";
import { ASSETS } from "@/lib/assets";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface Props {
  open: boolean;
  onClose: () => void;
  signalReport: SignalReportCard | null;
  genomeDimensions: GenomeDimension[];
}

export function ChallengeCompletionModal({ open, onClose, signalReport, genomeDimensions }: Props) {
  if (!signalReport) return null;

  const radarData = genomeDimensions.map(d => ({
    label: d.label,
    value: d.score,
    fullMark: 10,
  }));

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Signal Leaf Signal Card",
          text: `My cannabis clarity score is ${signalReport.clarityScore}%. Top terpene: ${signalReport.topTerpene ?? "Unknown"}. Best dose: ${signalReport.bestDoseWindow ?? "Unknown"}.`,
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto p-0 overflow-hidden border-primary/20 bg-card">
        {/* Glow header */}
        <div className="relative bg-gradient-to-b from-primary/15 to-transparent px-6 pt-8 pb-4 text-center">
          {/* Signal halo background */}
          <img
            src={ASSETS.signalHalo}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-contain opacity-[0.12] pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-[0_0_32px_-4px_hsl(var(--primary)/0.35)]"
          >
            <Award className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="font-serif text-xl font-semibold text-foreground">
            Your Signal Has Formed
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            10 sessions logged — here's your personal signal report.
          </p>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Genome radar mini */}
          {radarData.length > 0 && (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <PolarAngleAxis
                    dataKey="label"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
                  <Radar
                    name="Genome"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Clarity Score" value={`${signalReport.clarityScore}%`} />
            <StatBox label="Confidence" value={signalReport.confidenceLevel} />
            <StatBox label="Top Terpene" value={signalReport.topTerpene ?? "—"} />
            <StatBox label="Best Dose" value={capitalize(signalReport.bestDoseWindow ?? "—")} />
          </div>

          {signalReport.emergingRiskTrigger && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/15 p-3">
              <p className="text-xs text-destructive font-medium">⚠ Risk Signal</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {signalReport.emergingRiskTrigger}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 gap-1.5" asChild>
              <Link to="/insights" onClick={onClose}>
                Explore Insights
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
            {typeof navigator !== "undefined" && navigator.share && (
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
