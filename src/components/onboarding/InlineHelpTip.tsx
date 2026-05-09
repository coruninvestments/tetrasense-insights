import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logEvent } from "@/lib/analytics";

interface InlineHelpTipProps {
  /** Stable key used in analytics, e.g. "log.product" */
  tipType: string;
  /** Short tip body, plain text. Keep concise. */
  text: string;
  /** Optional label shown next to the icon. Defaults to "Tip" */
  label?: string;
  className?: string;
}

/**
 * Subtle, collapsible inline tip used inside form flows.
 * Mobile-friendly, non-intrusive — never auto-opens.
 */
export function InlineHelpTip({ tipType, text, label = "Tip", className }: InlineHelpTipProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      logEvent("inline_help_opened", { tip_type: tipType });
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        aria-expanded={open}
      >
        <HelpCircle className="w-3 h-3" />
        {label}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-1.5 text-[12px] text-muted-foreground leading-snug bg-secondary/40 rounded-md px-2.5 py-2 border border-border/40"
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
