import { useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SessionMemory } from "@/hooks/useSessionMemory";

interface Props {
  memory: SessionMemory;
}

const outcomeLabels: Record<string, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Not ideal",
};

export function SessionHistoryCard({ memory }: Props) {
  const [open, setOpen] = useState(false);

  if (memory.sessionCount < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <History className="w-4 h-4 shrink-0" />
        <span className="font-medium">From your history</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {memory.sessionCount} session{memory.sessionCount !== 1 ? "s" : ""}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 rounded-xl bg-secondary/60 space-y-1.5">
              {memory.lastOutcome && (
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">Last outcome:</span>{" "}
                  {outcomeLabels[memory.lastOutcome] || memory.lastOutcome}
                </p>
              )}
              {memory.mostCommonEffects && memory.mostCommonEffects.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">Common effects:</span>{" "}
                  {memory.mostCommonEffects.join(", ")}
                </p>
              )}
              {memory.typicalDuration && (
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">Typical duration:</span>{" "}
                  {memory.typicalDuration}
                </p>
              )}
              {memory.typicalDose && (
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">Typical dose:</span>{" "}
                  {memory.typicalDose}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
