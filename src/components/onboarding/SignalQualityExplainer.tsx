import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Signal, Info, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { logEvent } from "@/lib/analytics";

interface SignalQualityExplainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
}

const QUALITY_FACTORS = [
  "Session count over time",
  "Dose detail (amount, unit, method)",
  "Effects logged consistently",
  "Product or COA linked",
  "Context (sleep, stress, food, caffeine)",
  "Consistency week over week",
];

export function SignalQualityExplainer({ open, onOpenChange, source }: SignalQualityExplainerProps) {
  useEffect(() => {
    if (open) {
      logEvent("signal_quality_explainer_opened", { source: source ?? "unknown" });
    }
  }, [open, source]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Signal className="w-5 h-5 text-primary" />
          </div>
          <DialogTitle className="font-serif text-xl">
            Your Signal Gets Stronger With Better Logs
          </DialogTitle>
          <DialogDescription className="pt-1 text-sm leading-relaxed">
            Signal Strength improves as you log consistently and include useful details like dose,
            effects, context, and verified product chemistry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
            What makes a stronger signal
          </p>
          <ul className="space-y-1.5">
            {QUALITY_FACTORS.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button asChild className="w-full" onClick={() => onOpenChange(false)}>
          <Link to="/log">Log a Session</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}

interface SignalQualityHelpButtonProps {
  source?: string;
  className?: string;
}

/** Small inline "How does this work?" link that opens the explainer. */
export function SignalQualityHelpButton({ source, className }: SignalQualityHelpButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        }
      >
        <Info className="w-3 h-3" />
        How does this work?
      </button>
      <SignalQualityExplainer open={open} onOpenChange={setOpen} source={source} />
    </>
  );
}
