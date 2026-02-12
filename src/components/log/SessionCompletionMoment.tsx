import { motion } from "framer-motion";
import { Check, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { OutcomePreference } from "./OverallExperienceSection";
import type { PhysicalEffects } from "./PhysicalEffectsSection";
import type { EffectSliders } from "@/hooks/useSessionLogs";
import type { DurationBucket } from "./DurationSection";
import type { SessionIntent } from "@/hooks/useSessionLogs";

interface Props {
  outcomePreference: OutcomePreference | "";
  physicalEffects: PhysicalEffects;
  mentalEffects: EffectSliders;
  durationBucket: DurationBucket | "";
  intent: SessionIntent | "";
}

function getPersonalizedMessage(pref: OutcomePreference | ""): string {
  switch (pref) {
    case "use_again":
      return "Nice. That session worked for you. Want to save what made it successful?";
    case "neutral":
      return "Logged. Neutral sessions are still useful — they help you find what to adjust.";
    case "avoid":
      return "Logged. Good catch. Avoid sessions are important data — we'll help you reduce repeats.";
    default:
      return "Session saved. Every log helps build better insights for you.";
  }
}

function getOnePercentMove(
  physical: PhysicalEffects,
  mental: EffectSliders,
  duration: DurationBucket | "",
  pref: OutcomePreference | "",
  intent: SessionIntent | ""
): string | null {
  if (physical.dry_mouth >= 6) {
    return "💧 Try staying hydrated with electrolytes before and during your next session.";
  }
  if (physical.dry_eyes >= 6) {
    return "👁️ Keep eye drops handy — and note which strains/methods cause this most.";
  }
  if (physical.throat_irritation >= 6) {
    return "🫁 Consider switching to a gentler method or taking smaller pulls next time.";
  }
  if (mental.anxiety >= 6) {
    return "🧘 Try a lower dose next time, or set up a calming environment before your session.";
  }
  if (physical.body_heaviness >= 7 && intent === "focus") {
    return "🎯 Heavy body + focus intent is a mismatch — try adjusting your dose or method.";
  }
  if (duration === "6p_h" && pref === "avoid") {
    return "⏱️ Long session you'd skip next time — try a smaller dose to shorten the window.";
  }
  return null;
}

export function SessionCompletionMoment({
  outcomePreference,
  physicalEffects,
  mentalEffects,
  durationBucket,
  intent,
}: Props) {
  const navigate = useNavigate();
  const message = getPersonalizedMessage(outcomePreference);
  const suggestion = getOnePercentMove(physicalEffects, mentalEffects, durationBucket, outcomePreference, intent);

  return (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6"
      >
        <Check className="w-10 h-10 text-primary-foreground" />
      </motion.div>

      <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
        Session Saved
      </h2>

      <p className="text-muted-foreground mb-6 px-2 leading-relaxed">
        {message}
      </p>

      {suggestion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-secondary rounded-xl p-4 mb-8 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Your 1% Move
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{suggestion}</p>
        </motion.div>
      )}

      <div className="space-y-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => navigate("/")}
        >
          Done
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
  );
}
