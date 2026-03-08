import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Leaf, Beaker, Target, AlertTriangle,
  Shield, BarChart3, Activity, Share2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaywallGate } from "@/components/premium/PaywallGate";
import { SignalCardShareModal } from "./SignalCardShareModal";
import type { SignalCardData } from "@/lib/signalCard";

interface SignalCardModalProps {
  card: SignalCardData;
  open: boolean;
  onClose: () => void;
}

export function SignalCardModal({ card, open, onClose }: SignalCardModalProps) {
  const [showShare, setShowShare] = useState(false);
  const isPreview = card.stage === "preview";

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="font-serif text-lg">
                  Your Signal Card
                </DialogTitle>
                {isPreview && (
                  <Badge variant="outline" className="text-[10px] mt-1">
                    Preview — log {10 - card.sessionsLogged} more for full
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Identity */}
            <section className="text-center py-4 rounded-xl bg-secondary/30">
              <p className="font-serif text-xl font-medium text-foreground">
                {card.profileName}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {card.sessionsLogged} sessions logged
              </p>
            </section>

            {/* Key metrics */}
            <section className="grid grid-cols-3 gap-2">
              <MetricChip label="Clarity" value={`${card.clarityScore}%`} icon={Activity} />
              <MetricChip label="Confidence" value={card.confidenceLabel} icon={Shield} />
              <MetricChip
                label="Signal"
                value={card.signalStrengthLabel.replace(" Signal", "")}
                icon={BarChart3}
              />
            </section>

            {/* Dose & Method */}
            <section className="flex gap-3">
              {card.bestDoseRange !== "Gathering data" && (
                <div className="flex-1 p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Beaker className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] text-muted-foreground">Best Dose</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{card.bestDoseRange}</p>
                </div>
              )}
              {card.preferredMethod && (
                <div className="flex-1 p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] text-muted-foreground">Method</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{card.preferredMethod}</p>
                </div>
              )}
            </section>

            {/* Terpene likes */}
            {card.topTerpenes.length > 0 && (
              <section>
                <SectionLabel icon={Leaf} label="Terpene Likes" />
                <div className="space-y-2 mt-2">
                  {card.topTerpenes.map((t) => (
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

            {/* Top profile matches */}
            {card.topMatches.length > 0 && (
              <section>
                <SectionLabel icon={BarChart3} label="Profile Matches" />
                <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">
                  Based on your sessions — guided exploration, not product recommendations
                </p>
                <div className="space-y-2">
                  {card.topMatches.map((m, i) => (
                    <div
                      key={m.label}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30"
                    >
                      <span className="text-xs font-medium text-primary w-5 shrink-0">
                        #{i + 1}
                      </span>
                      <span className="text-sm text-foreground flex-1">{m.label}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {m.matchScore}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Watchouts — premium-gated for extended view */}
            {card.watchouts.length > 0 && (
              <section>
                <SectionLabel icon={AlertTriangle} label="Watchouts" />
                {/* First watchout always free */}
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{card.watchouts[0]}</p>
                  </div>
                </div>
                {card.watchouts.length > 1 && (
                  <PaywallGate feature="detailed watchouts" mode="blur">
                    <div className="space-y-1.5 mt-1.5">
                      {card.watchouts.slice(1).map((w, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">{w}</p>
                        </div>
                      ))}
                    </div>
                  </PaywallGate>
                )}
              </section>
            )}

            {/* Footer */}
            <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
              Built from your personal session history. Not medical advice.
            </p>

            {/* Share */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => setShowShare(true)}
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Signal Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SignalCardShareModal
        open={showShare}
        onOpenChange={setShowShare}
        card={card}
      />
    </>
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
