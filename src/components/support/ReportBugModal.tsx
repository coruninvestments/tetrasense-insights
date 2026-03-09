import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { submitTicket, getMailtoFallback } from "@/lib/support";

interface Props { open: boolean; onClose: () => void }

export function ReportBugModal({ open, onClose }: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [includeContext, setIncludeContext] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setSubject(""); setMessage(""); setIncludeContext(true); };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) { toast.error("Please fill in all fields"); return; }
    setSubmitting(true);
    try {
      await submitTicket({ type: "bug", subject: subject.trim(), message: message.trim(), includeContext });
      toast.success("Bug report submitted — thank you!");
      reset();
      onClose();
    } catch {
      const fallback = getMailtoFallback({ type: "bug", subject, message });
      toast.error("Submission failed", { description: "Try emailing us instead", action: { label: "Email", onClick: () => window.open(fallback, "_blank") } });
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Report a Bug</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="bug-subject">Subject</Label>
            <Input id="bug-subject" placeholder="Brief description" value={subject} onChange={e => setSubject(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bug-message">What happened?</Label>
            <Textarea id="bug-message" placeholder="Steps to reproduce, what you expected…" value={message} onChange={e => setMessage(e.target.value)} maxLength={2000} rows={4} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Include device info</p>
              <p className="text-xs text-muted-foreground">Browser, screen size, route</p>
            </div>
            <Switch checked={includeContext} onCheckedChange={setIncludeContext} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Sending…" : "Submit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
