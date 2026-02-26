import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function FeedbackSection() {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    const trimmed = message.trim().slice(0, 1000);

    setSubmitting(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        rating,
        message: trimmed || null,
      } as any);
      if (error) throw error;
      setSubmitted(true);
      toast.success("Thanks for your feedback!");
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5 text-center">
          <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Thank you!</p>
          <p className="text-xs text-muted-foreground mt-1">Your feedback helps us improve.</p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Send Feedback</h3>
        </div>

        {/* Star rating */}
        <div className="flex gap-1 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  star <= rating
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What could we improve? (optional)"
          maxLength={1000}
          rows={3}
          className="resize-none text-sm"
        />

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? "Sending…" : "Submit Feedback"}
        </Button>
      </Card>
    </motion.div>
  );
}
