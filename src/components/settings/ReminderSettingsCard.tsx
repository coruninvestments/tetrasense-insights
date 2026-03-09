import { useState, useEffect } from "react";
import { Bell, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  getReminderPreferences,
  saveReminderPreferences,
  requestBrowserPermission,
  type ReminderPreferences,
} from "@/lib/notifications";
import { toast } from "sonner";

const REMINDER_TYPES = [
  { key: "log_reminder" as const, label: "Log Reminders", desc: "Nudge to log after inactivity" },
  { key: "weekly_report" as const, label: "Weekly Report", desc: "When your weekly summary is ready" },
  { key: "new_unlock" as const, label: "New Unlocks", desc: "When you earn a new achievement" },
  { key: "challenge_progress" as const, label: "Challenge Progress", desc: "Milestones in your current challenge" },
];

export function ReminderSettingsCard() {
  const [prefs, setPrefs] = useState<ReminderPreferences>(getReminderPreferences);

  useEffect(() => {
    saveReminderPreferences(prefs);
  }, [prefs]);

  const toggle = (key: keyof Pick<ReminderPreferences, "log_reminder" | "weekly_report" | "new_unlock" | "challenge_progress">) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleBrowserToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestBrowserPermission();
      if (!granted) {
        toast.error("Browser notifications blocked. Enable in your browser settings.");
        return;
      }
    }
    setPrefs((p) => ({ ...p, browser_notifications: enabled }));
    toast.success(enabled ? "Browser notifications enabled" : "Browser notifications disabled");
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-foreground">Reminder Types</p>
        </div>

        {REMINDER_TYPES.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Switch checked={prefs[key]} onCheckedChange={() => toggle(key)} />
          </div>
        ))}
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-foreground">Delivery</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Browser notifications</p>
            <p className="text-xs text-muted-foreground">Show system-level alerts</p>
          </div>
          <Switch checked={prefs.browser_notifications} onCheckedChange={handleBrowserToggle} />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm text-foreground">Preferred time</p>
          <Select
            value={prefs.preferred_time}
            onValueChange={(v) => setPrefs((p) => ({ ...p, preferred_time: v as ReminderPreferences["preferred_time"] }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">When you'd prefer to receive reminders</p>
        </div>
      </Card>
    </div>
  );
}
