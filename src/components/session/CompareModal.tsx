import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { normalizeOutcome } from "@/lib/sessionOutcome";
import { format } from "date-fns";
import type { SessionLog } from "@/hooks/useSessionLogs";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface CompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionA: SessionLog;
  sessionB: SessionLog;
}

const outcomeBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  positive: { label: "Good", variant: "default" },
  neutral: { label: "Okay", variant: "secondary" },
  negative: { label: "Poor", variant: "destructive" },
};

function DeltaIcon({ a, b }: { a: number | null; b: number | null }) {
  const va = a ?? 0;
  const vb = b ?? 0;
  if (va > vb) return <ArrowUp className="w-3 h-3 text-primary" />;
  if (va < vb) return <ArrowDown className="w-3 h-3 text-destructive" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}

function Row({ label, valA, valB, showDelta = false }: { label: string; valA: string; valB: string; showDelta?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto_1fr] gap-2 items-center text-xs py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground truncate">{valA}</span>
      <span className="text-center text-muted-foreground font-medium">{label}</span>
      {showDelta ? <span /> : <span />}
      <span className="text-right text-muted-foreground truncate">{valB}</span>
    </div>
  );
}

export function CompareModal({ open, onOpenChange, sessionA, sessionB }: CompareModalProps) {
  const oA = normalizeOutcome(sessionA.outcome);
  const oB = normalizeOutcome(sessionB.outcome);
  const bA = outcomeBadge[oA];
  const bB = outcomeBadge[oB];

  const changes: string[] = [];
  if ((sessionA.dose_normalized_score ?? 0) !== (sessionB.dose_normalized_score ?? 0)) {
    const diff = (sessionA.dose_normalized_score ?? 0) - (sessionB.dose_normalized_score ?? 0);
    changes.push(`Dose ${diff > 0 ? "↑" : "↓"}`);
  }
  if (sessionA.caffeine !== sessionB.caffeine) {
    changes.push(`Caffeine ${sessionA.caffeine ? "Yes → No" : "No → Yes"}`);
  }
  if (sessionA.sleep_quality !== sessionB.sleep_quality) {
    changes.push(`Sleep: ${sessionA.sleep_quality ?? "—"} → ${sessionB.sleep_quality ?? "—"}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-base">Compare Sessions</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Headers */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">{format(new Date(sessionA.created_at), "MMM d, h:mm a")}</p>
              <Badge variant={bA.variant} className="text-[10px]">{bA.label}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">{format(new Date(sessionB.created_at), "MMM d, h:mm a")}</p>
              <Badge variant={bB.variant} className="text-[10px]">{bB.label}</Badge>
            </div>
          </div>

          {/* Comparison rows */}
          <div className="bg-muted/30 rounded-xl p-3">
            <Row label="Intent" valA={sessionA.intent} valB={sessionB.intent} />
            <Row label="Strain" valA={sessionA.strain_name_text} valB={sessionB.strain_name_text} />
            <Row label="Method" valA={sessionA.method} valB={sessionB.method} />
            <Row label="Dose" valA={sessionA.dose_level ?? "—"} valB={sessionB.dose_level ?? "—"} />
            <Row label="Relaxation" valA={String(sessionA.effect_relaxation ?? 0)} valB={String(sessionB.effect_relaxation ?? 0)} />
            <Row label="Focus" valA={String(sessionA.effect_focus ?? 0)} valB={String(sessionB.effect_focus ?? 0)} />
            <Row label="Anxiety" valA={String(sessionA.effect_anxiety ?? 0)} valB={String(sessionB.effect_anxiety ?? 0)} />
            <Row label="Euphoria" valA={String(sessionA.effect_euphoria ?? 0)} valB={String(sessionB.effect_euphoria ?? 0)} />
          </div>

          {/* Changes */}
          {changes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">What changed</p>
              <div className="flex flex-wrap gap-1.5">
                {changes.map(c => (
                  <span key={c} className="text-[11px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
