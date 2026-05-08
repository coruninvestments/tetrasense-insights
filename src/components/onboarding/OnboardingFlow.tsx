import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingCard } from "./OnboardingCard";
import { ONBOARDING_SCREENS } from "@/lib/onboarding";
import { logEvent } from "@/lib/analytics";

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
  /** When true, this is a manual replay rather than first-run. */
  isReplay?: boolean;
}

export function OnboardingFlow({ onComplete, onSkip, isReplay = false }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const startedRef = useRef(false);
  const total = ONBOARDING_SCREENS.length;
  const screen = ONBOARDING_SCREENS[step];
  const isLast = step === total - 1;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    logEvent("onboarding_started", { replay: isReplay, version: "v1" });
  }, [isReplay]);

  // Swipe gestures
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) handleNext();
    else handleBack();
  };

  const handleNext = () => {
    if (isLast) {
      logEvent("onboarding_completed", { version: "v1", replay: isReplay });
      onComplete();
    } else {
      setStep((s) => Math.min(total - 1, s + 1));
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSkip = () => {
    logEvent("onboarding_skipped", { at_step: step, version: "v1", replay: isReplay });
    (onSkip ?? onComplete)();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2 safe-top">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0 disabled:pointer-events-none flex items-center gap-1"
          aria-label="Back"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <OnboardingCard
            key={screen.id}
            icon={screen.icon}
            title={screen.title}
            body={screen.body}
            helper={screen.helper}
          />
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 pb-10 pt-4 safe-bottom space-y-5">
        <div className="flex justify-center gap-1.5" role="tablist" aria-label="Onboarding progress">
          {ONBOARDING_SCREENS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              aria-selected={i === step}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted hover:bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <Button size="lg" className="w-full" onClick={handleNext}>
          {screen.cta}
          {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
