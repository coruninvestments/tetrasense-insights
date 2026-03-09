import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitTicket, getMailtoFallback, SUPPORT_EMAIL } from "@/lib/support";

interface Props { open: boolean; onClose: () => void }

export function ContactSupportModal({ open, onClose }: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setSubject(""); setMessage(""); };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) { toast.error("Please fill in all fields"); return; }
    setSubmitting(true);
    try {
      await submitTicket({ type: "support", subject: subject.trim(), message: message.trim(), includeContext: true });
      toast.success("Message sent — we'll get back to you!");
      reset();
      onClose();
    } catch {
      const fallback = getMailtoFallback({ type: "support", subject, message });
      toast.error("Submission failed", { description: "Try emailing us instead", action: { label: "Email", onClick: () => window.open(fallback, "_blank") } });
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-xs text-muted-foreground">You can also reach us at <span className="text-primary">{SUPPORT_EMAIL}</span></p>
          <div className="space-y-1.5">
            <Label htmlFor="support-subject">Subject</Label>
            <Input id="support-subject" placeholder="How can we help?" value={subject} onChange={e => setSubject(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="support-message">Message</Label>
            <Textarea id="support-message" placeholder="Describe your issue…" value={message} onChange={e => setMessage(e.target.value)} maxLength={2000} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Sending…" : "Send"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
