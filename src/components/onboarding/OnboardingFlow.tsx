import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, FileWarning, Lock, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUpdateProfile } from "@/hooks/useProfile";
import { CURRENT_DISCLAIMER_VERSION, DISCLAIMER_LINES } from "@/utils/onboarding";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [communitySharing, setCommunitySharing] = useState(false);
  const updateProfile = useUpdateProfile();

  const totalSteps = 3;

  const canContinue = () => {
    if (currentStep === 0) return ageConfirmed;
    if (currentStep === 1) return disclaimerAccepted;
    if (currentStep === 2) return privacyAcknowledged;
    return false;
  };

  const handleFinish = async () => {
    try {
      await updateProfile.mutateAsync({
        legal_age_confirmed: true,
        disclaimer_accepted_at: new Date().toISOString(),
        disclaimer_version: CURRENT_DISCLAIMER_VERSION,
        privacy_acknowledged_at: new Date().toISOString(),
        community_sharing_enabled: communitySharing,
        onboarding_completed: true,
      } as any);
    } catch {
      // continue — will retry on next load
    }
    onComplete();
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const stepIcons = [ShieldCheck, FileWarning, Lock];
  const Icon = stepIcons[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Icon className="w-8 h-8 text-primary" />
            </div>

            {currentStep === 0 && <StepAge checked={ageConfirmed} onCheckedChange={setAgeConfirmed} />}
            {currentStep === 1 && <StepDisclaimer checked={disclaimerAccepted} onCheckedChange={setDisclaimerAccepted} />}
            {currentStep === 2 && (
              <StepPrivacy
                privacyChecked={privacyAcknowledged}
                onPrivacyChange={setPrivacyAcknowledged}
                sharingEnabled={communitySharing}
                onSharingChange={setCommunitySharing}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 pb-10 pt-4 safe-bottom space-y-4">
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={handleNext}
          disabled={!canContinue() || updateProfile.isPending}
        >
          {currentStep === totalSteps - 1 ? "Finish" : "Continue"}
          {currentStep < totalSteps - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}

/* ─── Step Components ─── */

function StepAge({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="text-center space-y-6">
      <h2 className="font-serif text-2xl font-medium text-foreground">Age &amp; Legal Responsibility</h2>

      <div className="flex items-start gap-3 text-left">
        <Checkbox id="age" checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} className="mt-0.5" />
        <Label htmlFor="age" className="text-sm leading-relaxed text-foreground cursor-pointer">
          I confirm I am of legal age to use cannabis in my location.
        </Label>
      </div>

      <p className="text-xs text-muted-foreground">
        You are responsible for following local laws. This app does not verify your age or location.
      </p>
    </div>
  );
}

function StepDisclaimer({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="text-center space-y-6">
      <h2 className="font-serif text-2xl font-medium text-foreground">Disclaimer</h2>

      <ul className="text-left text-sm text-muted-foreground space-y-3">
        {DISCLAIMER_LINES.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-start gap-3 text-left">
        <Checkbox id="disclaimer" checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} className="mt-0.5" />
        <Label htmlFor="disclaimer" className="text-sm leading-relaxed text-foreground cursor-pointer">
          I have read and understand this disclaimer.
        </Label>
      </div>
    </div>
  );
}

function StepPrivacy({
  privacyChecked,
  onPrivacyChange,
  sharingEnabled,
  onSharingChange,
}: {
  privacyChecked: boolean;
  onPrivacyChange: (v: boolean) => void;
  sharingEnabled: boolean;
  onSharingChange: (v: boolean) => void;
}) {
  return (
    <div className="text-center space-y-6">
      <h2 className="font-serif text-2xl font-medium text-foreground">Privacy &amp; Data</h2>

      <div className="flex items-start gap-3 text-left">
        <Checkbox id="privacy" checked={privacyChecked} onCheckedChange={(v) => onPrivacyChange(v === true)} className="mt-0.5" />
        <Label htmlFor="privacy" className="text-sm leading-relaxed text-foreground cursor-pointer">
          I understand my personal logs are private by default.
        </Label>
      </div>

      <div className="bg-muted/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="community-toggle" className="text-sm font-medium text-foreground cursor-pointer">
            Share anonymized community data
          </Label>
          <Switch id="community-toggle" checked={sharingEnabled} onCheckedChange={onSharingChange} />
        </div>
        <p className="text-xs text-muted-foreground text-left leading-relaxed">
          If enabled, only aggregated strain-level stats are used. No personal identifiers, notes, or timestamps are ever shared.
        </p>
      </div>
    </div>
  );
}
