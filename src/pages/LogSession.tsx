import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { EffectSlider } from "@/components/log/EffectSlider";
import { StrainPicker } from "@/components/log/StrainPicker";
import { PhysicalEffectsSection, type PhysicalEffects } from "@/components/log/PhysicalEffectsSection";
import { CustomEffectsSection } from "@/components/log/CustomEffectsSection";
import { DurationSection, type DurationBucket } from "@/components/log/DurationSection";
import { BodyMindSlider } from "@/components/log/BodyMindSlider";
import { OverallExperienceSection, type OutcomePreference } from "@/components/log/OverallExperienceSection";
import { SessionCompletionMoment } from "@/components/log/SessionCompletionMoment";
import { useCreateSessionLog, SessionIntent, SessionMethod, DoseLevel, EffectSliders } from "@/hooks/useSessionLogs";
import { useCustomEffects } from "@/hooks/useCustomEffects";
import { computeSessionOutcomeForPreview } from "@/lib/sessionOutcome";
import { toast } from "sonner";

const intents: { id: SessionIntent; label: string; emoji: string }[] = [
  { id: "sleep", label: "Sleep", emoji: "🌙" },
  { id: "relaxation", label: "Relaxation", emoji: "🧘" },
  { id: "focus", label: "Focus", emoji: "🎯" },
  { id: "pain_relief", label: "Pain Relief", emoji: "💆" },
  { id: "creativity", label: "Creativity", emoji: "🎨" },
  { id: "social", label: "Social", emoji: "👥" },
  { id: "recreation", label: "Recreation", emoji: "🎉" },
];

const methods: { id: SessionMethod; label: string; emoji: string }[] = [
  { id: "smoke", label: "Smoke", emoji: "🚬" },
  { id: "vape", label: "Vape", emoji: "💨" },
  { id: "edible", label: "Edible", emoji: "🍪" },
  { id: "tincture", label: "Tincture", emoji: "💧" },
  { id: "topical", label: "Topical", emoji: "🧴" },
  { id: "other", label: "Other", emoji: "✨" },
];

const mentalEffectsConfig = [
  { key: "sleepiness" as const, label: "Sleepiness", emoji: "😴" },
  { key: "relaxation" as const, label: "Relaxation", emoji: "😌" },
  { key: "anxiety" as const, label: "Anxiety", emoji: "😰" },
  { key: "focus" as const, label: "Focus", emoji: "🎯" },
  { key: "pain_relief" as const, label: "Pain Relief", emoji: "🩹" },
  { key: "euphoria" as const, label: "Euphoria", emoji: "🤩" },
];

type Step = "intent" | "strain" | "method" | "dose" | "effects" | "done";

export default function LogSession() {
  const navigate = useNavigate();
  const createSession = useCreateSessionLog();
  const { customEffects: customEffectDefs, addCustomEffect } = useCustomEffects();

  const [step, setStep] = useState<Step>("intent");
  const [selectedIntent, setSelectedIntent] = useState<SessionIntent | "">("");
  const [strainText, setStrainText] = useState("");
  const [selectedStrainId, setSelectedStrainId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<SessionMethod | "">("");
  const [doseLevel, setDoseLevel] = useState<DoseLevel>("medium");
  const [doseAmountMg, setDoseAmountMg] = useState<string>("");
  const [effects, setEffects] = useState<EffectSliders>({
    sleepiness: 0, relaxation: 0, anxiety: 0, focus: 0, pain_relief: 0, euphoria: 0,
  });
  const [physicalEffects, setPhysicalEffects] = useState<PhysicalEffects>({
    dry_mouth: 0, dry_eyes: 0, throat_irritation: 0, body_heaviness: 0,
  });
  const [customEffectValues, setCustomEffectValues] = useState<{ name: string; value: number }[]>([]);
  const [durationBucket, setDurationBucket] = useState<DurationBucket | "">("");
  const [bodyMind, setBodyMind] = useState(5);
  const [outcomePreference, setOutcomePreference] = useState<OutcomePreference | "">("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const steps: Step[] = ["intent", "strain", "method", "dose", "effects", "done"];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const doseLevels: { id: DoseLevel; label: string; description: string }[] = [
    { id: "low", label: "Low", description: "Microdose or low tolerance" },
    { id: "medium", label: "Medium", description: "Standard session" },
    { id: "high", label: "High", description: "Above usual intake" },
  ];

  const handleStrainSelect = (name: string, id: string | null) => {
    setStrainText(name);
    setSelectedStrainId(id);
  };

  const updateEffect = (key: keyof EffectSliders, value: number) => {
    setEffects(prev => ({ ...prev, [key]: value }));
  };

  const updatePhysicalEffect = (key: keyof PhysicalEffects, value: number) => {
    setPhysicalEffects(prev => ({ ...prev, [key]: value }));
  };

  const goNext = async () => {
    if (step === "effects") {
      setSaving(true);
      try {
        await createSession.mutateAsync({
          intent: selectedIntent as SessionIntent,
          strain_id: selectedStrainId,
          strain_name_text: strainText,
          method: selectedMethod as SessionMethod,
          dose_level: doseLevel,
          dose_amount_mg: doseAmountMg ? parseFloat(doseAmountMg) : null,
          effects,
          physicalEffects,
          durationBucket: durationBucket || undefined,
          bodyMind,
          outcomePreference: outcomePreference || undefined,
          customEffects: customEffectValues.filter(e => e.value > 0),
          notes: notes || undefined,
          outcome: computeSessionOutcomeForPreview(effects),
        });
        setStep("done");
        toast.success("Session logged successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to save session");
      } finally {
        setSaving(false);
      }
    } else {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setStep(steps[nextIndex]);
      }
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    } else {
      navigate(-1);
    }
  };

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
          <div className="flex items-center gap-4 px-5 py-4">
            <button
              onClick={goBack}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Log Session</p>
              <p className="text-xs text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length - 1}
              </p>
            </div>
          </div>
          <div className="h-1 bg-secondary">
            <motion.div
              className="h-full gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="px-5 py-6"
          >
            {/* Intent Step */}
            {step === "intent" && (
              <div>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                  What's your intention?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Select your primary goal for this session
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {intents.map((intent) => (
                    <Card
                      key={intent.id}
                      variant="interactive"
                      className={`p-4 ${selectedIntent === intent.id ? "ring-2 ring-primary bg-primary/5" : ""}`}
                      onClick={() => setSelectedIntent(intent.id)}
                    >
                      <span className="text-2xl mb-2 block">{intent.emoji}</span>
                      <span className="text-sm font-medium">{intent.label}</span>
                    </Card>
                  ))}
                </div>
                <div className="mt-8">
                  <Button variant="primary" size="lg" className="w-full" disabled={!selectedIntent} onClick={goNext}>
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Strain Step */}
            {step === "strain" && (
              <div>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">Which strain?</h2>
                <p className="text-muted-foreground mb-6">Search our library or add a custom strain</p>
                <StrainPicker value={strainText} selectedStrainId={selectedStrainId} onSelect={handleStrainSelect} />
                <div className="mt-8">
                  <Button variant="primary" size="lg" className="w-full" disabled={!strainText} onClick={goNext}>
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Method Step */}
            {step === "method" && (
              <div>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">How did you consume?</h2>
                <p className="text-muted-foreground mb-6">Select your consumption method</p>
                <div className="grid grid-cols-2 gap-3">
                  {methods.map((method) => (
                    <Card
                      key={method.id}
                      variant="interactive"
                      className={`p-4 ${selectedMethod === method.id ? "ring-2 ring-primary bg-primary/5" : ""}`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <span className="text-2xl mb-2 block">{method.emoji}</span>
                      <span className="text-sm font-medium">{method.label}</span>
                    </Card>
                  ))}
                </div>
                <div className="mt-8">
                  <Button variant="primary" size="lg" className="w-full" disabled={!selectedMethod} onClick={goNext}>
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Dose Step */}
            {step === "dose" && (
              <div>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">How much?</h2>
                <p className="text-muted-foreground mb-6">Estimate your dose level</p>
                <div className="space-y-3">
                  {doseLevels.map((level) => (
                    <Card
                      key={level.id}
                      variant="interactive"
                      className={`p-4 flex items-center justify-between ${doseLevel === level.id ? "ring-2 ring-primary bg-primary/5" : ""}`}
                      onClick={() => setDoseLevel(level.id)}
                    >
                      <div>
                        <span className="font-medium block">{level.label}</span>
                        <span className="text-xs text-muted-foreground">{level.description}</span>
                      </div>
                      {doseLevel === level.id && <Check className="w-5 h-5 text-primary" />}
                    </Card>
                  ))}
                </div>
                <div className="mt-6">
                  <label className="text-sm text-muted-foreground mb-2 block">Dose amount (optional)</label>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={doseAmountMg} onChange={(e) => setDoseAmountMg(e.target.value)} placeholder="e.g., 10" className="flex-1" />
                    <span className="text-sm text-muted-foreground">mg</span>
                  </div>
                </div>
                <div className="mt-8">
                  <Button variant="primary" size="lg" className="w-full" onClick={goNext}>
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Effects Step - Enhanced */}
            {step === "effects" && (
              <div>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                  Rate your experience
                </h2>
                <p className="text-muted-foreground mb-6">
                  Slide to rate each effect from 0–10
                </p>

                <div className="space-y-8">
                  {/* Section 1: Mental & Functional Effects */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Mental & Functional Effects
                    </h3>
                    <div className="space-y-5">
                      {mentalEffectsConfig.map((effect) => (
                        <EffectSlider
                          key={effect.key}
                          label={effect.label}
                          emoji={effect.emoji}
                          value={effects[effect.key]}
                          onChange={(value) => updateEffect(effect.key, value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Physical Effects */}
                  <PhysicalEffectsSection
                    effects={physicalEffects}
                    onChange={updatePhysicalEffect}
                  />

                  {/* Section 3: Custom Effects */}
                  <CustomEffectsSection
                    definitions={customEffectDefs}
                    values={customEffectValues}
                    onValuesChange={setCustomEffectValues}
                    onAddEffect={addCustomEffect}
                  />

                  {/* Section 4: Duration */}
                  <DurationSection value={durationBucket} onChange={setDurationBucket} />

                  {/* Section 5: Body vs Mind */}
                  <BodyMindSlider value={bodyMind} onChange={setBodyMind} />

                  {/* Section 6: Overall Experience */}
                  <OverallExperienceSection value={outcomePreference} onChange={setOutcomePreference} />

                  {/* Section 7: Notes */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Notes (Optional)
                    </h3>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional thoughts about this session..."
                      className="w-full h-24 px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 pb-6">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={saving}
                    onClick={goNext}
                  >
                    {saving ? "Saving..." : "Save Session"}
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Done Step - Session Completion Moment */}
            {step === "done" && (
              <SessionCompletionMoment
                outcomePreference={outcomePreference}
                physicalEffects={physicalEffects}
                mentalEffects={effects}
                durationBucket={durationBucket}
                intent={selectedIntent}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
