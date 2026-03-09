import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { submitTicket, getMailtoFallback, type TicketType } from "@/lib/support";

interface Props { open: boolean; onClose: () => void }

export function FeedbackModal({ open, onClose }: Props) {
  const [category, setCategory] = useState<TicketType>("feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setCategory("feedback"); setSubject(""); setMessage(""); };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) { toast.error("Please fill in all fields"); return; }
    setSubmitting(true);
    try {
      await submitTicket({ type: category, subject: subject.trim(), message: message.trim() });
      toast.success("Thank you for your feedback!");
      reset();
      onClose();
    } catch {
      const fallback = getMailtoFallback({ type: category, subject, message });
      toast.error("Submission failed", { description: "Try emailing us instead", action: { label: "Email", onClick: () => window.open(fallback, "_blank") } });
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TicketType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="feedback">General Feedback</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fb-subject">Subject</Label>
            <Input id="fb-subject" placeholder="What's on your mind?" value={subject} onChange={e => setSubject(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fb-message">Details</Label>
            <Textarea id="fb-message" placeholder="Tell us more…" value={message} onChange={e => setMessage(e.target.value)} maxLength={2000} rows={4} />
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
