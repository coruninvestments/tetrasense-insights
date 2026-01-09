import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";

const intents = [
  { id: "sleep", label: "Sleep", emoji: "🌙" },
  { id: "anxiety", label: "Anxiety Relief", emoji: "😌" },
  { id: "focus", label: "Focus", emoji: "🎯" },
  { id: "pain", label: "Pain Relief", emoji: "💆" },
  { id: "relaxation", label: "Relaxation", emoji: "🧘" },
  { id: "creativity", label: "Creativity", emoji: "🎨" },
];

const methods = [
  { id: "smoke", label: "Smoke" },
  { id: "vape", label: "Vape" },
  { id: "edible", label: "Edible" },
  { id: "tincture", label: "Tincture" },
  { id: "other", label: "Other" },
];

const effects = [
  { id: "relaxed", label: "Relaxed" },
  { id: "sleepy", label: "Sleepy" },
  { id: "euphoric", label: "Euphoric" },
  { id: "focused", label: "Focused" },
  { id: "creative", label: "Creative" },
  { id: "anxious", label: "Anxious" },
  { id: "paranoid", label: "Paranoid" },
  { id: "hungry", label: "Hungry" },
];

type Step = "intent" | "strain" | "method" | "dose" | "effects" | "done";

export default function LogSession() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intent");
  const [selectedIntent, setSelectedIntent] = useState<string>("");
  const [strain, setStrain] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [dose, setDose] = useState(1); // 0 = low, 1 = medium, 2 = high
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);

  const steps: Step[] = ["intent", "strain", "method", "dose", "effects", "done"];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / (steps.length)) * 100;

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    } else {
      navigate(-1);
    }
  };

  const toggleEffect = (effectId: string) => {
    setSelectedEffects((prev) =>
      prev.includes(effectId)
        ? prev.filter((e) => e !== effectId)
        : [...prev, effectId]
    );
  };

  const doseLabels = ["Low", "Medium", "High"];

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
          {/* Progress bar */}
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
                      className={`p-4 ${
                        selectedIntent === intent.id
                          ? "ring-2 ring-primary bg-primary/5"
                          : ""
                      }`}
                      onClick={() => setSelectedIntent(intent.id)}
                    >
                      <span className="text-2xl mb-2 block">{intent.emoji}</span>
                      <span className="text-sm font-medium">{intent.label}</span>
                    </Card>
                  ))}
                </div>

                <div className="mt-8">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={!selectedIntent}
                    onClick={goNext}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Strain Step */}
            {step === "strain" && (
              <div>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                  Which strain?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Enter the strain name or search
                </p>

                <input
                  type="text"
                  value={strain}
                  onChange={(e) => setStrain(e.target.value)}
                  placeholder="e.g., Blue Dream, OG Kush..."
                  className="w-full h-14 px-5 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Popular strains</p>
                  <div className="flex flex-wrap gap-2">
                    {["Blue Dream", "OG Kush", "Granddaddy Purple", "Jack Herer", "Girl Scout Cookies"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStrain(s)}
                        className={`px-3 py-1.5 rounded-full text-sm ${
                          strain === s
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={!strain}
                    onClick={goNext}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Method Step */}
            {step === "method" && (
              <div>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                  How did you consume?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Select your consumption method
                </p>

                <div className="space-y-3">
                  {methods.map((method) => (
                    <Card
                      key={method.id}
                      variant="interactive"
                      className={`p-4 flex items-center justify-between ${
                        selectedMethod === method.id
                          ? "ring-2 ring-primary bg-primary/5"
                          : ""
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <span className="font-medium">{method.label}</span>
                      {selectedMethod === method.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </Card>
                  ))}
                </div>

                <div className="mt-8">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={!selectedMethod}
                    onClick={goNext}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Dose Step */}
            {step === "dose" && (
              <div>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                  How much?
                </h2>
                <p className="text-muted-foreground mb-8">
                  Estimate your dose level
                </p>

                <div className="px-4">
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={2}
                      value={dose}
                      onChange={(e) => setDose(Number(e.target.value))}
                      className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between mt-3">
                      {doseLabels.map((label, i) => (
                        <span
                          key={label}
                          className={`text-sm ${
                            dose === i
                              ? "text-primary font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Card variant="glass" className="mt-8 p-4">
                    <p className="text-sm text-muted-foreground">
                      {dose === 0 && "A small amount — good for microdosing or low tolerance"}
                      {dose === 1 && "A standard session — your typical amount"}
                      {dose === 2 && "A larger amount — above your usual intake"}
                    </p>
                  </Card>
                </div>

                <div className="mt-8">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={goNext}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Effects Step */}
            {step === "effects" && (
              <div>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                  How do you feel?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Select all that apply
                </p>

                <div className="flex flex-wrap gap-2">
                  {effects.map((effect) => (
                    <button
                      key={effect.id}
                      onClick={() => toggleEffect(effect.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedEffects.includes(effect.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {effect.label}
                    </button>
                  ))}
                </div>

                <div className="mt-8">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={goNext}
                  >
                    Save Session
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Done Step */}
            {step === "done" && (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-10 h-10 text-primary-foreground" />
                </motion.div>

                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                  Session Logged!
                </h2>
                <p className="text-muted-foreground mb-8">
                  Your data helps build personalized insights
                </p>

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    Back to Home
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => navigate("/insights")}
                  >
                    View Insights
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
