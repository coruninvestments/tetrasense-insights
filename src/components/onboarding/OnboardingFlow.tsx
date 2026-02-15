import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Sliders, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateProfile } from "@/hooks/useProfile";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Shield,
    title: "Your data is private by default",
    description:
      "All session data stays personal. You can optionally opt-in to anonymous community sharing later — nothing is shared without your explicit consent.",
    accent: "text-primary",
  },
  {
    icon: Zap,
    title: "Logging is fast & consistent",
    description:
      "Each session takes under a minute to log. Pick your intent, strain, dose, and rate your effects. Quick Log mode hides advanced options so you can log even faster.",
    accent: "text-primary",
  },
  {
    icon: Sliders,
    title: "Your scale, your anchors",
    description:
      "Effect sliders go from 0 to 10. You can calibrate what 0 and 10 mean for each effect in Settings — so your ratings stay consistent and personal over time.",
    accent: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "What you'll unlock",
    description:
      "After 5 sessions, Personal Patterns will surface your trends. The Explore tab shows read-only community data. Premium insights are coming soon.",
    accent: "text-primary",
  },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const updateProfile = useUpdateProfile();

  const handleFinish = async () => {
    try {
      await updateProfile.mutateAsync({ onboarding_completed: true });
    } catch {
      // continue anyway — onboarding state will retry next load
    }
    onComplete();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Skip */}
      <div className="flex justify-end px-5 pt-12 safe-top">
        <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
              <Icon className={`w-10 h-10 ${step.accent}`} />
            </div>
            <h2 className="font-serif text-2xl font-medium text-foreground mb-4">
              {step.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-8 pb-12 safe-bottom space-y-4">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleNext}
          disabled={updateProfile.isPending}
        >
          {isLast ? "Get Started" : "Next"}
          {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
