import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const STORAGE_KEY = "insights:milestone10Dismissed";

interface MilestoneCalloutProps {
  sessionCount: number;
}

export function MilestoneCallout({ sessionCount }: MilestoneCalloutProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
    setIsDismissed(dismissed);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const scrollToRelationship = () => {
    const section = document.getElementById("relationship-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Only show if user has 10+ sessions and hasn't dismissed
  if (sessionCount < 10 || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Alert className="relative bg-primary/5 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="font-serif text-base text-foreground pr-6">
            Your Cannabis Pattern Is Emerging
          </AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground mt-1">
            With 10 sessions logged, we can now surface early patterns in your usage.{" "}
            <button
              onClick={scrollToRelationship}
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
            >
              See your relationship insights
            </button>
            .
          </AlertDescription>
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}
