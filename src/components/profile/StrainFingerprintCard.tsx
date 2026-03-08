import { useState } from "react";
import { motion } from "framer-motion";
import { Fingerprint, ChevronRight, Lock, Leaf, Beaker, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeSignalFingerprint, type SignalFingerprint } from "@/lib/signalFingerprint";
import { StrainFingerprintModal } from "./StrainFingerprintModal";

interface StrainFingerprintCardProps {
  compact?: boolean;
}

export function StrainFingerprintCard({ compact = false }: StrainFingerprintCardProps) {
  const { data: sessions } = useSessionLogs();
  const [showModal, setShowModal] = useState(false);

  const fingerprint = computeSignalFingerprint(sessions ?? []);

  // Locked state
  if (!fingerprint.unlocked) {
    const progress = Math.min((fingerprint.sessionCount / 5) * 100, 100);

    if (compact) return null;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="overflow-hidden">
          <CardContent className="p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Your Strain Fingerprint</p>
            <p className="text-xs text-muted-foreground">{fingerprint.effectSubtitle}</p>
            <div className="w-full max-w-[200px] mx-auto space-y-1.5">
              <Progress value={progress} className="h-1.5" />
              <p className="text-[11px] text-muted-foreground">
                {fingerprint.sessionCount} of 5 sessions logged
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Compact preview (dashboard)
  if (compact) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card
          variant="interactive"
          className="overflow-hidden cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Fingerprint className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Your Fingerprint</p>
              <p className="text-sm font-medium text-foreground truncate">
                {fingerprint.effectIdentity}
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {fingerprint.clarityScore}%
            </Badge>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
        <StrainFingerprintModal
          fingerprint={fingerprint}
          open={showModal}
          onClose={() => setShowModal(false)}
        />
      </motion.div>
    );
  }

  // Full card (profile)
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="insight" className="overflow-hidden">
          <CardContent className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Fingerprint className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Your Strain Fingerprint</p>
                <p className="font-serif text-lg font-medium text-foreground">
                  {fingerprint.effectIdentity}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fingerprint.effectSubtitle}
                </p>
              </div>
              {fingerprint.stage === "preview" && (
                <Badge variant="outline" className="text-[10px] shrink-0">Preview</Badge>
              )}
            </div>

            {/* Key metrics row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-secondary/50">
                <p className="text-lg font-serif font-medium text-foreground">
                  {fingerprint.clarityScore}%
                </p>
                <p className="text-[10px] text-muted-foreground">Clarity</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-secondary/50">
                <p className="text-sm font-medium text-foreground">
                  {fingerprint.confidenceLevel}
                </p>
                <p className="text-[10px] text-muted-foreground">Confidence</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-secondary/50">
                <p className="text-sm font-medium text-foreground truncate">
                  {fingerprint.signalStrengthLevel.replace(" Signal", "")}
                </p>
                <p className="text-[10px] text-muted-foreground">Signal</p>
              </div>
            </div>

            {/* Quick info chips */}
            <div className="flex flex-wrap gap-2">
              {fingerprint.topTerpenes.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 text-xs text-foreground">
                  <Leaf className="w-3 h-3 text-primary" />
                  {fingerprint.topTerpenes[0].name}
                </div>
              )}
              {fingerprint.bestDoseRange !== "Gathering data" && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 text-xs text-foreground">
                  <Beaker className="w-3 h-3 text-primary" />
                  {fingerprint.bestDoseRange}
                </div>
              )}
              {fingerprint.preferredMethod && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 text-xs text-foreground">
                  <Target className="w-3 h-3 text-primary" />
                  {fingerprint.preferredMethod}
                </div>
              )}
            </div>

            {/* Genome mini preview */}
            {fingerprint.genomeSummary.length > 0 && (
              <div className="space-y-1.5">
                {fingerprint.genomeSummary.slice(0, 3).map((dim) => (
                  <div key={dim.label} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-20 text-right shrink-0">
                      {dim.label}
                    </span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(dim.value / 10) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground w-6">
                      {dim.value.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* View full button */}
            <Button
              variant="soft"
              size="sm"
              className="w-full"
              onClick={() => setShowModal(true)}
            >
              View full fingerprint
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <StrainFingerprintModal
        fingerprint={fingerprint}
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
