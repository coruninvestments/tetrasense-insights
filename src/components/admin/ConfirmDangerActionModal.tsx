import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmPhrase?: string;
  onConfirm: () => Promise<void>;
  destructive?: boolean;
}

export function ConfirmDangerActionModal({
  open, onClose, title, description, confirmPhrase, onConfirm, destructive = true,
}: Props) {
  const [input, setInput] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [running, setRunning] = useState(false);

  const reset = () => { setInput(""); setStep(1); };
  const handleClose = () => { reset(); onClose(); };

  const phraseMatch = !confirmPhrase || input === confirmPhrase;

  const handleProceed = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (!phraseMatch) return;
    setRunning(true);
    try {
      await onConfirm();
      handleClose();
    } catch {
      // caller handles toast
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {destructive && <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          {step === 1 && (
            <p className="text-sm text-foreground">
              Are you sure you want to proceed? This action {destructive ? "may be irreversible" : "will take effect immediately"}.
            </p>
          )}

          {step === 2 && confirmPhrase && (
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                Type <span className="font-mono font-medium text-destructive">{confirmPhrase}</span> to confirm:
              </p>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={confirmPhrase}
                className="font-mono text-sm"
                autoFocus
              />
            </div>
          )}

          {step === 2 && !confirmPhrase && (
            <p className="text-sm text-foreground font-medium">
              Final confirmation — click below to execute.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={running}>Cancel</Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={handleProceed}
            disabled={running || (step === 2 && !phraseMatch)}
          >
            {running ? "Processing…" : step === 1 ? "Continue" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
