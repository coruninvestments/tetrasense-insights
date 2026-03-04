import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Crown, Sparkles, X, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { BrandImage } from "@/components/brand/BrandImage";
import { ASSETS } from "@/lib/assets";
import { toast } from "@/hooks/use-toast";

interface PaywallGateProps {
  children: ReactNode;
  feature?: string;
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
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-[min(92vw,560px)] max-h-[calc(100vh-2rem)] bg-card border border-border rounded-2xl shadow-elevated overflow-hidden flex flex-col"
          >
            {/* Sticky close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable body */}
            <div className="overflow-y-auto overscroll-contain flex-1" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)" }}>
              {/* Hero with stardust ring */}
              <div className="relative gradient-primary overflow-hidden">
                {/* Stardust radial overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: [
                      "radial-gradient(ellipse 60% 50% at 50% 40%, hsl(163 30% 70% / 0.12) 0%, transparent 70%)",
                      "radial-gradient(ellipse 40% 35% at 50% 45%, hsl(163 40% 80% / 0.08) 0%, transparent 60%)",
                      "radial-gradient(circle at 30% 20%, hsl(200 40% 80% / 0.06) 0%, transparent 40%)",
                      "radial-gradient(circle at 70% 30%, hsl(163 50% 90% / 0.05) 0%, transparent 35%)",
                    ].join(", "),
                  }}
                />

                {/* Hero image */}
                <div className="relative flex items-center justify-center pt-6 pb-2 px-6 min-h-[140px]">
                  <BrandImage
                    src={ASSETS.heroPremiumDark}
                    alt="Signal Leaf Premium"
                    themeAware
                    className="max-h-[130px] w-auto object-contain rounded-xl opacity-90"
                  />
                </div>

                {/* Title block */}
                <div className="relative text-center px-6 pb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h2 className="font-serif text-xl font-medium text-primary-foreground">
                    Signal Leaf Premium
                  </h2>
                  <p className="text-sm text-primary-foreground/80 mt-1">
                    Unlock the full picture of your experience
                  </p>
                  <p className="text-xs text-primary-foreground/60 mt-1.5 italic">
                    Your private clarity engine — powered by your own patterns.
                  </p>
                </div>
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
              <div className="px-6 pb-10 space-y-2">
                <Button className="w-full" size="lg" disabled>
                  Coming Soon
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5"
                  onClick={() => {
                    toast({
                      title: "Waitlist coming soon",
                      description: "We'll let you know when Premium is available.",
                    });
                  }}
                >
                  <Bell className="w-3.5 h-3.5" />
                  Join the Premium waitlist
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
