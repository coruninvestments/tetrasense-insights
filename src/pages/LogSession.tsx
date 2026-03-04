import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { EffectSlider } from "@/components/log/EffectSlider";
import { StrainPicker } from "@/components/log/StrainPicker";
import { BatchChooser } from "@/components/log/BatchChooser";
import { ActiveBatchCard } from "@/components/log/ActiveBatchCard";
import { SessionCompletionMoment } from "@/components/log/SessionCompletionMoment";
import { ContextSection, emptyContext, type SessionContext } from "@/components/log/ContextSection";
import { SessionHistoryCard } from "@/components/log/SessionHistoryCard";
import { useCreateSessionLog, SessionIntent, SessionMethod, DoseLevel, EffectSliders } from "@/hooks/useSessionLogs";
import { useProfile } from "@/hooks/useProfile";
import { useActiveBatch } from "@/hooks/useActiveBatch";
import { useSessionMemory } from "@/hooks/useSessionMemory";
import { computeSessionOutcomeForPreview } from "@/lib/sessionOutcome";
import { toast } from "sonner";

type Step = "product" | "intent" | "dose" | "effects" | "context" | "done";

const steps: Step[] = ["product", "intent", "dose", "effects", "context", "done"];

const intents: { id: SessionIntent; label: string; emoji: string }[] = [
  { id: "sleep", label: "Sleep", emoji: "🌙" },
  { id: "focus", label: "Focus", emoji: "🎯" },
  { id: "relaxation", label: "Relax", emoji: "🧘" },
  { id: "creativity", label: "Creativity", emoji: "🎨" },
  { id: "pain_relief", label: "Pain", emoji: "💆" },
  { id: "social", label: "Social", emoji: "👥" },
  { id: "recreation", label: "Recreation", emoji: "🎉" },
  { id: "learning", label: "Learning", emoji: "🧠" },
];

const methods: { id: SessionMethod; label: string; emoji: string }[] = [
  { id: "smoke", label: "Smoke", emoji: "🚬" },
  { id: "vape", label: "Vape", emoji: "💨" },
  { id: "edible", label: "Edible", emoji: "🍪" },
  { id: "tincture", label: "Tincture", emoji: "💧" },
  { id: "topical", label: "Topical", emoji: "🧴" },
  { id: "other", label: "Other", emoji: "✨" },
];

const effectsConfig = [
  { key: "relaxation" as const, label: "Relaxation", emoji: "😌" },
  { key: "focus" as const, label: "Focus", emoji: "🎯" },
  { key: "sleepiness" as const, label: "Energy", emoji: "⚡" },
  { key: "anxiety" as const, label: "Anxiety", emoji: "😰" },
  { key: "pain_relief" as const, label: "Pain Relief", emoji: "🩹" },
  { key: "euphoria" as const, label: "Mood", emoji: "😊" },
];

const doseUnits = ["hit", "puff", "bowl", "dab", "g", "mg", "other"] as const;

const doseLevels: { id: DoseLevel; label: string; desc: string }[] = [
  { id: "low", label: "Low", desc: "Microdose / low tolerance" },
  { id: "medium", label: "Medium", desc: "Standard session" },
  { id: "high", label: "High", desc: "Above usual intake" },
];

const slideVariants = {
  enter: { opacity: 0, y: 24 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export default function LogSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createSession = useCreateSessionLog();
  const { data: profile } = useProfile();
  const { activeBatch, setActiveBatch, clearActiveBatch } = useActiveBatch();

  const [step, setStep] = useState<Step>("product");
  const [activeBatchUsed, setActiveBatchUsed] = useState(false);

  // Product
  const [strainText, setStrainText] = useState(searchParams.get("strain") || "");
  const [selectedStrainId, setSelectedStrainId] = useState<string | null>(null);
  const [canonicalStrainId, setCanonicalStrainId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [coaAttached, setCoaAttached] = useState(false);

  // Intent
  const [selectedIntent, setSelectedIntent] = useState<SessionIntent | "">(
    (searchParams.get("intent") as SessionIntent) || ""
  );

  // Dose
  const [selectedMethod, setSelectedMethod] = useState<SessionMethod | "">(
    (searchParams.get("method") as SessionMethod) || ""
  );
  const [doseLevel, setDoseLevel] = useState<DoseLevel>("medium");
  const [doseUnit, setDoseUnit] = useState<string | null>(null);
  const [doseCount, setDoseCount] = useState("");
  const [doseAmountMg, setDoseAmountMg] = useState("");

  // Effects
  const [effects, setEffects] = useState<EffectSliders>({
    sleepiness: 0, relaxation: 0, anxiety: 0, focus: 0, pain_relief: 0, euphoria: 0,
  });

  // Context
  const [context, setContext] = useState<SessionContext>(emptyContext);
  const [notes, setNotes] = useState("");

  // Flow state
  const [saving, setSaving] = useState(false);

  const { data: memory } = useSessionMemory(
    selectedIntent || undefined,
    strainText || undefined
  );

  const currentIndex = steps.indexOf(step);
  const progress = step === "done" ? 100 : ((currentIndex) / (steps.length - 1)) * 100;

  const handleStrainSelect = (name: string, id: string | null, canonicalId?: string | null) => {
    setStrainText(name);
    setSelectedStrainId(id);
    setCanonicalStrainId(canonicalId || null);
    if (canonicalId !== canonicalStrainId) {
      setSelectedProductId(null);
      setSelectedBatchId(null);
      setCoaAttached(false);
    }
  };

  const handleBatchSelect = (productId: string | null, batchId: string | null, hasCoa: boolean) => {
    setSelectedProductId(productId);
    setSelectedBatchId(batchId);
    setCoaAttached(hasCoa);
  };

  const updateEffect = (key: keyof EffectSliders, value: number) => {
    setEffects(prev => ({ ...prev, [key]: value }));
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case "product": return !!strainText;
      case "intent": return !!selectedIntent;
      case "dose": return !!selectedMethod;
      case "effects": return true;
      case "context": return true;
      default: return false;
    }
  };

  const goNext = async () => {
    if (step === "context") {
      setSaving(true);
      try {
        await createSession.mutateAsync({
          intent: selectedIntent as SessionIntent,
          strain_id: selectedStrainId,
          strain_name_text: strainText,
          method: selectedMethod as SessionMethod,
          dose_level: doseLevel,
          dose_amount_mg: doseUnit === "mg"
            ? (doseCount ? parseFloat(doseCount) : (doseAmountMg ? parseFloat(doseAmountMg) : null))
            : (doseAmountMg ? parseFloat(doseAmountMg) : null),
          dose_unit: doseUnit || undefined,
          dose_count: doseCount ? parseFloat(doseCount) : undefined,
          effects,
          notes: notes || undefined,
          outcome: computeSessionOutcomeForPreview(effects),
          canonical_strain_id: canonicalStrainId,
          product_id: selectedProductId,
          batch_id: selectedBatchId,
          coa_attached: coaAttached,
          time_of_day: context.time_of_day,
          setting: context.setting,
          stomach: context.stomach,
          caffeine: context.caffeine,
          hydration: context.hydration,
          sleep_quality: context.sleep_quality,
          mood_before: context.mood_before,
          stress_before: context.stress_before,
        });
        if (canonicalStrainId && selectedProductId) {
          setActiveBatch(canonicalStrainId, selectedProductId, selectedBatchId);
        }
        setStep("done");
        toast.success("Session logged!");
      } catch (error: any) {
        toast.error(error.message || "Failed to save session");
      } finally {
        setSaving(false);
      }
    } else {
      const nextIndex = currentIndex + 1;
      if (nextIndex < steps.length) {
        setStep(steps[nextIndex]);
      }
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    } else {
      navigate(-1);
    }
  };

  // Step labels for header
  const stepLabels: Record<Step, string> = {
    product: "Product",
    intent: "Intent",
    dose: "Dose",
    effects: "Effects",
    context: "Context",
    done: "Complete",
  };

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm safe-top">
          <div className="flex items-center gap-3 px-5 py-4">
            <button
              onClick={goBack}
              className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Log Session</p>
              {step !== "done" && (
                <p className="text-[11px] text-muted-foreground">
                  Step {currentIndex + 1} of {steps.length - 1} — {stepLabels[step]}
                </p>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-0.5 bg-secondary/40">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </header>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="px-5 py-6"
          >
            {/* ─── Step 1: Product ─── */}
            {step === "product" && (
              <div className="space-y-6">
                {activeBatch && !activeBatchUsed && (
                  <ActiveBatchCard
                    batch={activeBatch}
                    onContinue={() => {
                      setStrainText(activeBatch.strainName);
                      setCanonicalStrainId(activeBatch.canonicalStrainId);
                      setSelectedProductId(activeBatch.productId);
                      setSelectedBatchId(activeBatch.batchId);
                      setCoaAttached(false);
                      setActiveBatchUsed(true);
                    }}
                    onChange={() => setActiveBatchUsed(false)}
                    onClear={() => clearActiveBatch()}
                  />
                )}

                <div>
                  <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
                    What are you using?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Search our library or enter a strain name
                  </p>
                </div>

                <Card className="p-5 space-y-4">
                  <StrainPicker
                    value={strainText}
                    selectedStrainId={selectedStrainId}
                    canonicalStrainId={canonicalStrainId}
                    onSelect={handleStrainSelect}
                  />

                  {canonicalStrainId && (
                    <BatchChooser
                      canonicalStrainId={canonicalStrainId}
                      selectedBatchId={selectedBatchId}
                      selectedProductId={selectedProductId}
                      onSelect={handleBatchSelect}
                    />
                  )}
                </Card>

                {strainText && <SessionHistoryCard memory={memory} />}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!canAdvance()}
                  onClick={goNext}
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* ─── Step 2: Intent ─── */}
            {step === "intent" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
                    What's your intention?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Select your primary goal for this session
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {intents.map((intent) => (
                    <button
                      key={intent.id}
                      onClick={() => setSelectedIntent(intent.id)}
                      className={`flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition-all duration-200 ${
                        selectedIntent === intent.id
                          ? "border-primary bg-primary/10 shadow-glow"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <span className="text-2xl">{intent.emoji}</span>
                      <span className="text-sm font-medium text-foreground">{intent.label}</span>
                    </button>
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!canAdvance()}
                  onClick={goNext}
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* ─── Step 3: Dose ─── */}
            {step === "dose" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
                    How are you consuming?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Method, level, and amount
                  </p>
                </div>

                {/* Method selector */}
                <Card className="p-5 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Method
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {methods.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMethod(m.id)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all duration-200 ${
                          selectedMethod === m.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card/50 hover:border-primary/30"
                        }`}
                      >
                        <span className="text-xl">{m.emoji}</span>
                        <span className="text-[11px] font-medium text-foreground">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Dose level */}
                <Card className="p-5 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Dose Level
                  </p>
                  <div className="space-y-2">
                    {doseLevels.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setDoseLevel(level.id)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                          doseLevel === level.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card/50 hover:border-primary/30"
                        }`}
                      >
                        <div className="text-left">
                          <span className="text-sm font-medium text-foreground block">{level.label}</span>
                          <span className="text-[11px] text-muted-foreground">{level.desc}</span>
                        </div>
                        {doseLevel === level.id && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Dose unit & count */}
                <Card className="p-5 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Amount <span className="font-normal">(optional)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {doseUnits.map((unit) => (
                      <button
                        key={unit}
                        onClick={() => {
                          setDoseUnit(doseUnit === unit ? null : unit);
                          if (unit === "mg" && doseUnit !== "mg" && doseAmountMg) {
                            setDoseCount(doseAmountMg);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          doseUnit === unit
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                  {doseUnit && (
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={doseUnit === "mg" ? (doseCount || doseAmountMg) : doseCount}
                      onChange={(e) => {
                        setDoseCount(e.target.value);
                        if (doseUnit === "mg") setDoseAmountMg(e.target.value);
                      }}
                      placeholder={doseUnit === "mg" ? "e.g., 10" : "e.g., 2"}
                      className="w-32"
                    />
                  )}
                </Card>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!canAdvance()}
                  onClick={goNext}
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* ─── Step 4: Effects ─── */}
            {step === "effects" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
                    How does it feel?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Rate each effect from 0–10
                  </p>
                </div>

                <Card className="p-5 space-y-6">
                  {effectsConfig.map((effect) => (
                    <EffectSlider
                      key={effect.key}
                      label={effect.label}
                      emoji={effect.emoji}
                      value={effects[effect.key]}
                      onChange={(value) => updateEffect(effect.key, value)}
                    />
                  ))}
                </Card>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={goNext}
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* ─── Step 5: Context ─── */}
            {step === "context" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-foreground mb-1">
                    Add context
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Optional — helps identify patterns over time
                  </p>
                </div>

                <Card className="p-5">
                  <ContextSection value={context} onChange={setContext} defaultOpen />
                </Card>

                {/* Notes */}
                <Card className="p-5 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Notes <span className="font-normal">(optional)</span>
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything else worth noting..."
                    className="w-full h-20 px-4 py-3 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </Card>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={saving}
                  onClick={goNext}
                >
                  {saving ? "Saving..." : "Save Session"} <Check className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* ─── Step 6: Completion ─── */}
            {step === "done" && (
              <SessionCompletionMoment
                sessionId={createSession.data?.id}
                strainName={strainText}
                intent={selectedIntent as string}
                method={selectedMethod as string}
                doseLevel={doseLevel}
                sessionContext={{
                  caffeine: context.caffeine,
                  stomach: context.stomach,
                  sleep_quality: context.sleep_quality,
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
