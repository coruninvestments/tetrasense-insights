import { useState } from "react";
import { Bug, HelpCircle, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ReportBugModal } from "./ReportBugModal";
import { ContactSupportModal } from "./ContactSupportModal";
import { FeedbackModal } from "./FeedbackModal";

const items = [
  { key: "bug" as const, icon: Bug, label: "Report a Bug", desc: "Something broken? Let us know" },
  { key: "support" as const, icon: HelpCircle, label: "Contact Support", desc: "Get help with your account" },
  { key: "feedback" as const, icon: MessageSquare, label: "Send Feedback", desc: "Ideas, requests, or praise" },
];

export function SupportCenterCard() {
  const [open, setOpen] = useState<"bug" | "support" | "feedback" | null>(null);

  return (
    <>
      <div className="space-y-2">
        {items.map(({ key, icon: Icon, label, desc }) => (
          <button
            key={key}
            onClick={() => setOpen(key)}
            className="w-full text-left"
          >
            <Card className="p-4 flex items-center gap-3 hover:bg-secondary/40 transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </Card>
          </button>
        ))}
      </div>

      <ReportBugModal open={open === "bug"} onClose={() => setOpen(null)} />
      <ContactSupportModal open={open === "support"} onClose={() => setOpen(null)} />
      <FeedbackModal open={open === "feedback"} onClose={() => setOpen(null)} />
    </>
  );
}
