import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { HelpTip } from "@/components/guide/HelpTip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface PrivacyCommunitySectionProps {
  enabled: boolean;
  onToggle: (value: boolean) => void | Promise<void>;
  isPending: boolean;
}

const sharingBullets = [
  { shared: false, text: "Individual sessions, notes, or timestamps" },
  { shared: false, text: "Location, custom strain text, or personal details" },
  { shared: false, text: "Anything that can identify you" },
  { shared: false, text: "Device identifiers or analytics IDs" },
  { shared: true, text: "Aggregated, de-identified effect averages for library strains only (no custom text)" },
  { shared: true, text: "Anonymous outcome statistics (positive/neutral/avoid)" },
];

function SharingDetails() {
  return (
    <ul className="space-y-2 text-sm">
      {sharingBullets.map((b, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className={b.shared ? "text-primary" : "text-destructive"}>
            {b.shared ? "✓" : "✗"}
          </span>
          <span className="text-muted-foreground">
            {b.shared ? "We share: " : "We DO NOT share: "}
            {b.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PrivacyCommunitySection({ enabled, onToggle, isPending }: PrivacyCommunitySectionProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  const handleToggleChange = (checked: boolean) => {
    if (checked) {
      setShowConfirm(true);
    } else {
      onToggle(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await onToggle(true);
      setShowConfirm(false);
    } catch {
      toast({ title: "Error", description: "Failed to enable sharing. Please try again.", variant: "destructive" });
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          Privacy & Community
          <HelpTip
            id="privacy_community_sharing"
            title="Community Sharing"
            description="When enabled, your session data is anonymized and aggregated into community insights visible on the Explore page. No personal details, timestamps, or individual sessions are ever shared."
          />
        </h3>
        <Card className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-foreground">Contribute anonymous community stats</p>
              <p className="text-xs text-muted-foreground">
                Off by default. If enabled, we only share aggregated, de-identified stats to improve community insights.
              </p>
              <p className="text-xs text-muted-foreground">
                You can turn this off anytime. Your data will only be included while this is enabled.
              </p>
              <button
                type="button"
                aria-label="Learn more about community data sharing"
                onClick={() => setShowLearnMore(true)}
                className="text-xs text-primary hover:underline mt-1"
              >
                Learn more
              </button>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggleChange}
              disabled={isPending}
            />
          </div>
        </Card>
      </motion.div>

      {/* Confirmation modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enable Anonymous Community Sharing?</DialogTitle>
            <DialogDescription className="pt-2">
              Your privacy is our priority. Here's exactly what this means:
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <SharingDetails />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleConfirm} disabled={isPending} className="w-full">
              {isPending ? "Saving…" : "Enable Sharing"}
            </Button>
            <Button variant="ghost" onClick={() => setShowConfirm(false)} className="w-full">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Learn more dialog */}
      <Dialog open={showLearnMore} onOpenChange={setShowLearnMore}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>What We Share & Don't Share</DialogTitle>
            <DialogDescription className="pt-2">
              Community insights are built from fully anonymous, aggregated data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <SharingDetails />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowLearnMore(false)} className="w-full">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
