import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Search, ThumbsUp, Minus, ThumbsDown, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IntensityBadge } from "@/components/shared/IntensityBadge";
import { useCanonicalStrains } from "@/hooks/useCanonicalStrains";
import { useCreateSessionLog, type SessionIntent } from "@/hooks/useSessionLogs";
import { computeIntensity } from "@/lib/psychoactiveIntensity";
import {
  QUICK_METHODS,
  getDoseOptions,
  buildSessionFromQuickLog,
  type QuickMethod,
  type QuickOutcome,
  type QuickDoseOption,
} from "@/lib/quickLog";
import { toast } from "sonner";

type QuickStep = "strain" | "method" | "dose" | "outcome" | "done";

const INTENT_CHIPS: { id: SessionIntent; label: string; emoji: string }[] = [
  { id: "focus", label: "Focus", emoji: "🎯" },
  { id: "relaxation", label: "Relax", emoji: "😌" },
  { id: "sleep", label: "Sleep", emoji: "😴" },
  { id: "creativity", label: "Creative", emoji: "🎨" },
  { id: "social", label: "Social", emoji: "🤝" },
];

const CONTEXT_CHIPS = [
  { id: "low_stress", label: "Low stress", emoji: "🧘" },
  { id: "high_stress", label: "High stress", emoji: "😤" },
  { id: "tired", label: "Tired", emoji: "😴" },
  { id: "caffeine", label: "Caffeine", emoji: "☕" },
];

const OUTCOME_OPTIONS: { id: QuickOutcome; label: string; icon: typeof ThumbsUp; color: string }[] = [
  { id: "good", label: "Good", icon: ThumbsUp, color: "text-success" },
  { id: "neutral", label: "Neutral", icon: Minus, color: "text-muted-foreground" },
  { id: "bad", label: "Bad", icon: ThumbsDown, color: "text-destructive" },
];

interface QuickLogCardProps {
  onClose?: () => void;
  inline?: boolean;
}

export function QuickLogCard({ onClose, inline = false }: QuickLogCardProps) {
  const navigate = useNavigate();
  const createSession = useCreateSessionLog();

  const [step, setStep] = useState<QuickStep>("strain");

  // Strain
  const [search, setSearch] = useState("");
  const [strainText, setStrainText] = useState("");
  const [canonicalStrainId, setCanonicalStrainId] = useState<string | null>(null);

  // Selections
  const [method, setMethod] = useState<QuickMethod | null>(null);
  const [dose, setDose] = useState<QuickDoseOption | null>(null);
  const [outcome, setOutcome] = useState<QuickOutcome | null>(null);
  const [intent, setIntent] = useState<SessionIntent | null>(null);
  const [contextTags, setContextTags] = useState<string[]>([]);

  const { data: strains } = useCanonicalStrains(search);

  const doseOptions = useMemo(
    () => (method ? getDoseOptions(method) : []),
    [method]
  );

  const toggleContext = (id: string) => {
    setContextTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSelectStrain = (name: string, id: string | null) => {
    setStrainText(name);
    setCanonicalStrainId(id);
    setStep("method");
  };

  const handleSelectMethod = (m: QuickMethod) => {
    setMethod(m);
    setStep("dose");
  };

  const handleSelectDose = (d: QuickDoseOption) => {
    setDose(d);
    setStep("outcome");
  };

  const handleSelectOutcome = async (o: QuickOutcome) => {
    setOutcome(o);

    if (!method || !dose) return;

    const input = buildSessionFromQuickLog({
      strainText,
      canonicalStrainId,
      method,
      dose,
      outcome: o,
      intent: intent ?? undefined,
      contextTags,
    });

    try {
      await createSession.mutateAsync(input);
      setStep("done");
    } catch {
      toast.error("Failed to save session");
    }
  };

  const slideVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const Wrapper = inline ? "div" : Card;

  return (
    <Wrapper className={inline ? "" : "overflow-hidden"}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Quick Log</h3>
          {step !== "done" && step !== "strain" && (
            <div className="ml-auto flex items-center gap-1">
              {(["strain", "method", "dose", "outcome"] as QuickStep[]).map((s, i) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    (["strain", "method", "dose", "outcome"] as QuickStep[]).indexOf(step) >= i
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Strain */}
          {step === "strain" && (
            <motion.div
              key="strain"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search strain or product…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-11"
                  autoFocus
                />
              </div>

              <div className="max-h-44 overflow-y-auto space-y-1">
                {strains && strains.length > 0 ? (
                  strains.slice(0, 6).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStrain(s.canonical_name, s.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/60 active:bg-accent text-left transition-colors"
                    >
                      <span className="text-sm text-foreground truncate">{s.canonical_name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))
                ) : search.length > 0 ? (
                  <button
                    onClick={() => handleSelectStrain(search, null)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/60 text-left transition-colors"
                  >
                    <span className="text-sm text-foreground">Use "{search}"</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                ) : null}
              </div>
            </motion.div>
          )}

          {/* Step 2: Method */}
          {step === "method" && (
            <motion.div
              key="method"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <p className="text-xs text-muted-foreground">{strainText}</p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMethod(m.id)}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-border hover:border-primary hover:bg-accent/50 active:scale-95 transition-all"
                  >
                    <span className="text-lg">{m.emoji}</span>
                    <span className="text-xs font-medium text-foreground">{m.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Dose */}
          {step === "dose" && (
            <motion.div
              key="dose"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <p className="text-xs text-muted-foreground">
                {strainText} · {QUICK_METHODS.find((m) => m.id === method)?.label}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {doseOptions.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectDose(d)}
                    className="py-3 px-4 rounded-xl border border-border hover:border-primary hover:bg-accent/50 active:scale-95 transition-all text-sm font-medium text-foreground text-center"
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Optional intent chips */}
              <div className="pt-1">
                <p className="text-[11px] text-muted-foreground mb-2">Intent (optional)</p>
                <div className="flex flex-wrap gap-1.5">
                  {INTENT_CHIPS.map((ic) => (
                    <button
                      key={ic.id}
                      onClick={() => setIntent(intent === ic.id ? null : ic.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        intent === ic.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {ic.emoji} {ic.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional context */}
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Context (optional)</p>
                <div className="flex flex-wrap gap-1.5">
                  {CONTEXT_CHIPS.map((cc) => (
                    <button
                      key={cc.id}
                      onClick={() => toggleContext(cc.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        contextTags.includes(cc.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {cc.emoji} {cc.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Outcome */}
          {step === "outcome" && (
            <motion.div
              key="outcome"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <p className="text-xs text-muted-foreground">How was it?</p>
              <div className="grid grid-cols-3 gap-3">
                {OUTCOME_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleSelectOutcome(o.id)}
                    disabled={createSession.isPending}
                    className="flex flex-col items-center gap-2 py-4 rounded-xl border border-border hover:border-primary hover:bg-accent/50 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <o.icon className={`w-6 h-6 ${o.color}`} />
                    <span className="text-xs font-medium text-foreground">{o.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Done */}
          {step === "done" && (
            <motion.div
              key="done"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="text-center space-y-4 py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-12 h-12 mx-auto rounded-full bg-success/15 flex items-center justify-center"
              >
                <Check className="w-6 h-6 text-success" />
              </motion.div>
              <p className="text-sm font-medium text-foreground">Session logged</p>
              {method && dose && outcome && (() => {
                const intensity = computeIntensity({
                  method,
                  doseLevel: dose.doseLevel,
                  thcMg: dose.doseAmountMg ?? null,
                  doseUnit: dose.doseUnit ?? null,
                  doseCount: dose.doseCount ?? null,
                });
                return (
                  <IntensityBadge
                    score={intensity.intensityScore}
                    confidence={intensity.confidence}
                    reasoning={intensity.reasoning}
                    size="md"
                  />
                );
              })()}
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/log?expand=true")}
                >
                  Add more detail
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (onClose) onClose();
                    else {
                      setStep("strain");
                      setSearch("");
                      setStrainText("");
                      setCanonicalStrainId(null);
                      setMethod(null);
                      setDose(null);
                      setOutcome(null);
                      setIntent(null);
                      setContextTags([]);
                    }
                  }}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Wrapper>
  );
}
