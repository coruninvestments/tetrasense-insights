import { useEffect, useState } from "react";
import { FlaskConical, ShieldCheck, Sparkles, BarChart3, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { logEvent } from "@/lib/analytics";

interface COAEducationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
}

const POINTS = [
  { icon: ShieldCheck, text: "Verifies what is in the product" },
  { icon: BarChart3, text: "Improves product chemistry accuracy" },
  { icon: Sparkles, text: "Helps Signal Leaf make better comparisons" },
  { icon: Eye, text: "Imported COAs are reviewed before becoming verified public chemistry" },
];

export function COAEducationModal({ open, onOpenChange, source }: COAEducationModalProps) {
  useEffect(() => {
    if (open) {
      logEvent("coa_education_opened", { source: source ?? "unknown" });
    }
  }, [open, source]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <DialogTitle className="font-serif text-xl">What is a COA?</DialogTitle>
          <DialogDescription className="pt-1 text-sm leading-relaxed">
            A COA, or Certificate of Analysis, is a lab report for a cannabis product. It can show
            cannabinoids, terpenes, batch numbers, and test dates.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 py-2">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-secondary/60 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground leading-snug">{text}</p>
            </li>
          ))}
        </ul>

        <Button className="w-full" onClick={() => onOpenChange(false)}>
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

interface COAEducationLinkProps {
  source?: string;
  className?: string;
}

/** Small "What's a COA?" text link/button that opens the education modal. */
export function COAEducationLink({ source, className }: COAEducationLinkProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "text-[11px] text-primary hover:underline inline-flex items-center gap-1"
        }
      >
        What's a COA?
      </button>
      <COAEducationModal open={open} onOpenChange={setOpen} source={source} />
    </>
  );
}
