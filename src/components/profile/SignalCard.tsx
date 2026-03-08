import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, ChevronRight, Lock, Leaf, Beaker, Target,
  Activity, Shield, BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeSignalCard, type SignalCardData } from "@/lib/signalCard";
import { SignalCardModal } from "./SignalCardModal";

interface SignalCardProps {
  compact?: boolean;
}

export function SignalCard({ compact = false }: SignalCardProps) {
  const { data: sessions } = useSessionLogs();
  const [showModal, setShowModal] = useState(false);

  const card = computeSignalCard(sessions ?? []);

  // Locked
  if (!card.unlocked) {
    const progress = Math.min((card.sessionsLogged / 5) * 100, 100);

    if (compact) return null;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="overflow-hidden">
          <CardContent className="p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Your Signal Card</p>
            <p className="text-xs text-muted-foreground">
              {card.sessionsLogged}/5 sessions — keep logging to unlock
            </p>
            <div className="w-full max-w-[200px] mx-auto space-y-1.5">
              <Progress value={progress} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Compact (dashboard)
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
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Signal Card</p>
              <p className="text-sm font-medium text-foreground truncate">
                {card.profileName}
              </p>
            </div>
            {card.topTerpenes.length > 0 && (
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {card.topTerpenes[0].name}
              </Badge>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
        <SignalCardModal card={card} open={showModal} onClose={() => setShowModal(false)} />
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
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Your Signal Card</p>
                <p className="font-serif text-lg font-medium text-foreground">
                  {card.profileName}
                </p>
              </div>
              {card.stage === "preview" && (
                <Badge variant="outline" className="text-[10px] shrink-0">Preview</Badge>
              )}
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-3">
              <MetricBox label="Clarity" value={`${card.clarityScore}%`} />
              <MetricBox label="Confidence" value={card.confidenceLabel} />
              <MetricBox label="Signal" value={card.signalStrengthLabel.replace(" Signal", "")} />
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2">
              {card.topTerpenes.length > 0 && (
                <Chip icon={Leaf} label={card.topTerpenes[0].name} />
              )}
              {card.bestDoseRange !== "Gathering data" && (
                <Chip icon={Beaker} label={card.bestDoseRange} />
              )}
              {card.preferredMethod && (
                <Chip icon={Target} label={card.preferredMethod} />
              )}
            </div>

            {/* Top matches */}
            {card.topMatches.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground">Profile Matches</p>
                {card.topMatches.map((m) => (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="text-xs text-foreground flex-1">{m.label}</span>
                    <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${m.matchScore}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground w-8 text-right">
                      {m.matchScore}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="soft"
              size="sm"
              className="w-full"
              onClick={() => setShowModal(true)}
            >
              View full card
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <SignalCardModal card={card} open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

/* ── Small helpers ────────────────────────────────────────────────── */

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-secondary/50">
      <p className="text-sm font-medium text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Chip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 text-xs text-foreground">
      <Icon className="w-3 h-3 text-primary" />
      {label}
    </div>
  );
}
