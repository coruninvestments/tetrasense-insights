import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Crown, Sparkles, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

interface PaywallGateProps {
  children: ReactNode;
  /** Short label shown on the lock overlay, e.g. "Pattern Timeline" */
  feature?: string;
  /** If true, render inline blur overlay instead of blocking entirely */
  mode?: "block" | "blur";
}

const PREMIUM_BULLETS = [
  "Pattern Timeline & advanced trend analysis",
  "Detailed 'Why it ranks' explanations",
  "Full lab panel & COA deep-view",
  "Export sessions to PDF",
  "Priority support & early features",
];

export function PaywallGate({ children, feature, mode = "blur" }: PaywallGateProps) {
  const { isPremium } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  if (isPremium) return <>{children}</>;

  if (mode === "block") {
    return (
      <>
        <LockedCard feature={feature} onTap={() => setShowModal(true)} />
        <PaywallModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  // Blur mode — show content behind blur with a lock overlay
  return (
    <>
      <div className="relative">
        <div className="pointer-events-none select-none blur-[6px] opacity-60">
          {children}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/30 backdrop-blur-[2px] rounded-xl cursor-pointer transition-colors hover:bg-background/40"
        >
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground">
            {feature ? `Unlock ${feature}` : "Premium feature"}
          </span>
          <span className="text-[10px] text-muted-foreground">Tap to learn more</span>
        </button>
      </div>
      <PaywallModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

function LockedCard({ feature, onTap }: { feature?: string; onTap: () => void }) {
  return (
    <Card
      variant="glass"
      className="p-5 flex items-center gap-4 cursor-pointer hover:shadow-elevated transition-all"
      onClick={onTap}
    >
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Lock className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {feature || "Premium Feature"}
        </p>
        <p className="text-xs text-muted-foreground">Upgrade to unlock</p>
      </div>
      <Crown className="w-4 h-4 text-primary/60" />
    </Card>
  );
}

function PaywallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-elevated overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="gradient-primary px-6 pt-8 pb-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="font-serif text-xl font-medium text-primary-foreground">
                Signal Leaf Premium
              </h2>
              <p className="text-sm text-primary-foreground/80 mt-1">
                Unlock the full picture of your experience
              </p>
            </div>

            {/* Benefits */}
            <div className="px-6 py-5 space-y-3">
              {PREMIUM_BULLETS.map((bullet) => (
                <div key={bullet} className="flex items-start gap-2.5">
                  <Crown className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{bullet}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-2">
              <Button className="w-full" size="lg" disabled>
                Coming Soon
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => {
                  window.location.href = "mailto:hello@signalleaf.app?subject=Beta%20Access%20Request";
                }}
              >
                Join beta · Request early access
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
