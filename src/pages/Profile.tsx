import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, LogOut, Mail, Calendar, Crown, ChevronRight,
  Bell, Moon, Sun, Users, ArrowLeft, Sliders, AlertTriangle, Shield, Settings, Monitor, Zap, BarChart3,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { SignalLeafLogo } from "@/components/brand/SignalLeafLogo";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useSessionStats } from "@/hooks/useSessionLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PrivacyCommunitySection } from "@/components/profile/PrivacyCommunitySection";
import { CalibrationScreen } from "@/components/onboarding/CalibrationScreen";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { DISCLAIMER_LINES } from "@/utils/onboarding";
import { FeedbackSection } from "@/components/profile/FeedbackSection";
import { AchievementBadges } from "@/components/achievements/AchievementBadges";
import { ConnoisseurProfileCard } from "@/components/profile/ConnoisseurProfileCard";
import { TerpenePreferenceCard } from "@/components/insights/TerpenePreferenceCard";
import { LearningPathCard } from "@/components/learning/LearningPathCard";
import { ExportReportButton } from "@/components/profile/ExportReportButton";
import { ConnoisseurPointsCard } from "@/components/profile/ConnoisseurPointsCard";
import { RecentUnlocksCard } from "@/components/profile/RecentUnlocksCard";
import { StrainFingerprintCard } from "@/components/profile/StrainFingerprintCard";
import { SignalCard } from "@/components/profile/SignalCard";
import { PaywallModal } from "@/components/premium/PaywallGate";
import { AchievementUnlockedModal } from "@/components/achievements/AchievementUnlockedModal";
import type { AchievementKey } from "@/lib/achievements";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ReminderSettingsCard } from "@/components/settings/ReminderSettingsCard";
import { format } from "date-fns";

type Section = "main" | "edit" | "notifications" | "privacy" | "settings" | "calibration" | "onboarding";

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function Profile() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isPremium, tier, canUseDevPremium, devOverride, setDevOverride } = useSubscription();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats, isLoading: statsLoading } = useSessionStats();
  const updateProfile = useUpdateProfile();
  const { isAdmin } = useIsAdmin();
  const [activeSection, setActiveSection] = useState<Section>("main");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<AchievementKey | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const key = (e as CustomEvent).detail as AchievementKey;
      setUnlockedAchievement(key);
    };
    window.addEventListener("achievement-unlocked", handler);
    return () => window.removeEventListener("achievement-unlocked", handler);
  }, []);

  // isPremium comes from useSubscription above
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Welcome";
  const memberSince = user?.created_at
    ? format(new Date(user.created_at), "MMMM yyyy")
    : null;

  // Edit profile form state
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editWeight, setEditWeight] = useState("");

  const openEdit = () => {
    setEditName(profile?.display_name || "");
    setEditAge(profile?.age_range || "");
    setEditWeight(profile?.weight_range || "");
    setActiveSection("edit");
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: editName || null,
        age_range: editAge || null,
        weight_range: editWeight || null,
      });
      toast.success("Profile updated");
      setActiveSection("main");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  /* ── Sub-section views ── */

  if (activeSection === "onboarding") {
    return <OnboardingFlow onComplete={() => setActiveSection("main")} />;
  }

  if (activeSection === "calibration") {
    return (
      <AppLayout>
        <CalibrationScreen onBack={() => setActiveSection("settings")} />
      </AppLayout>
    );
  }

  if (activeSection !== "main") {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background">
          <header className="px-5 pt-12 pb-4 safe-top flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setActiveSection("main")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-medium text-foreground">
              {activeSection === "edit" && "Edit Profile"}
              {activeSection === "notifications" && "Notifications"}
              {activeSection === "privacy" && "Privacy & Data"}
              {activeSection === "settings" && "Settings"}
            </h1>
          </header>

          <div className="px-5 pb-28 space-y-5">
            {activeSection === "edit" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label>Age Range</Label>
                  <Select value={editAge} onValueChange={setEditAge}>
                    <SelectTrigger><SelectValue placeholder="Select age range" /></SelectTrigger>
                    <SelectContent>
                      {["18-24", "25-34", "35-44", "45-54", "55+"].map(v => (
                        <SelectItem key={v} value={v}>{v.replace("-", "–")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Weight Range</Label>
                  <Select value={editWeight} onValueChange={setEditWeight}>
                    <SelectTrigger><SelectValue placeholder="Select weight range" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-120">Under 120 lbs</SelectItem>
                      <SelectItem value="120-160">120–160 lbs</SelectItem>
                      <SelectItem value="160-200">160–200 lbs</SelectItem>
                      <SelectItem value="200-250">200–250 lbs</SelectItem>
                      <SelectItem value="250+">250+ lbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </motion.div>
            )}

            {activeSection === "notifications" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ReminderSettingsCard />
              </motion.div>
            )}

            {activeSection === "privacy" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <PrivacyCommunitySection
                  enabled={profile?.community_sharing_enabled ?? false}
                  onToggle={async (value) => {
                    try {
                      await updateProfile.mutateAsync({ community_sharing_enabled: value });
                      toast.success(value ? "Community sharing enabled" : "Community sharing disabled");
                    } catch {
                      toast.error("Failed to update preference");
                    }
                  }}
                  isPending={updateProfile.isPending}
                />
                <Card className="p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">Medical Disclaimer</p>
                  <p className="text-xs text-muted-foreground">Accepted version: {profile?.disclaimer_version ?? "—"}</p>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setShowDisclaimer(true)}>
                    Review Disclaimer
                  </Button>
                </Card>
                <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">Export My Data</Button>
                <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">Delete My Account</Button>
              </motion.div>
            )}

            {activeSection === "settings" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Card className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Theme</p>
                      <p className="text-xs text-muted-foreground">Choose your appearance</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {([
                      { value: "light", icon: Sun, label: "Light" },
                      { value: "dark", icon: Moon, label: "Dark" },
                      { value: "system", icon: Monitor, label: "System" },
                    ] as const).map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                          theme === value
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </Card>
                <Card className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Guide Mode</p>
                    <p className="text-xs text-muted-foreground">Show helpful explanations</p>
                  </div>
                  <Switch
                    checked={profile?.guide_mode_enabled ?? true}
                    onCheckedChange={async (value) => {
                      try {
                        await updateProfile.mutateAsync({ guide_mode_enabled: value });
                        toast.success(value ? "Guide Mode enabled" : "Guide Mode disabled");
                      } catch { toast.error("Failed to update"); }
                    }}
                    disabled={updateProfile.isPending}
                  />
                </Card>
                <Card className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Quick Log</p>
                    <p className="text-xs text-muted-foreground">Hide advanced fields by default</p>
                  </div>
                  <Switch
                    checked={profile?.quick_log_enabled ?? true}
                    onCheckedChange={async (value) => {
                      try {
                        await updateProfile.mutateAsync({ quick_log_enabled: value });
                        toast.success(value ? "Quick Log enabled" : "Full Log mode");
                      } catch { toast.error("Failed to update"); }
                    }}
                    disabled={updateProfile.isPending}
                  />
                </Card>
                <Button variant="outline" className="w-full" onClick={() => setActiveSection("calibration")}>
                  <Sliders className="w-4 h-4 mr-2" /> Edit Scale Calibration
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setActiveSection("onboarding")}>Re-run Onboarding</Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={updateProfile.isPending || (profile?.dismissed_tip_ids?.length ?? 0) === 0}
                  onClick={async () => {
                    try { await updateProfile.mutateAsync({ dismissed_tip_ids: [] }); toast.success("Tips reset"); }
                    catch { toast.error("Failed to reset tips"); }
                  }}
                >Reset Tips</Button>

                {/* Admin: Founder Dashboard link */}
                {isAdmin && (
                  <Button variant="outline" className="w-full border-dashed border-primary/30" onClick={() => navigate("/admin/founder-dashboard")}>
                    <BarChart3 className="w-4 h-4 mr-2" /> Founder Dashboard
                  </Button>
                )}

                {/* Dev Premium Override */}
                {canUseDevPremium && setDevOverride && (
                  <Card className="p-4 flex items-center justify-between border-dashed border-warning/40">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-warning" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Dev: Pretend Premium</p>
                        <p className="text-xs text-muted-foreground">Simulate premium for testing</p>
                      </div>
                    </div>
                    <Switch
                      checked={devOverride}
                      onCheckedChange={(v) => setDevOverride(v)}
                    />
                  </Card>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  /* ── Main Profile View ── */
  return (
    <>
      <AppLayout>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="px-5 pt-12 pb-6 safe-top">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                {profileLoading ? (
                  <Skeleton className="h-6 w-32 mb-1" />
                ) : (
                  <h1 className="font-serif text-xl font-medium text-foreground truncate">
                    {displayName}
                  </h1>
                )}
                <div className="flex items-center gap-3 mt-0.5">
                  {memberSince && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Member since {memberSince}
                    </span>
                  )}
                </div>
              </div>
              <SignalLeafLogo variant="icon" size="sm" />
            </motion.div>
          </header>

          <div className="px-5 pb-28 space-y-6">
            {/* Premium CTA */}
            {!isPremium && (
              <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
                <button
                  type="button"
                  onClick={() => setShowPaywall(true)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowPaywall(true); } }}
                  className="w-full text-left gradient-primary border-0 p-5 rounded-xl shadow-card transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                  aria-label="Upgrade to Premium"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-foreground/20 flex items-center justify-center pointer-events-none">
                      <Crown className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 pointer-events-none">
                      <h3 className="font-medium text-primary-foreground mb-0.5">Upgrade to Premium</h3>
                      <p className="text-sm text-primary-foreground/80">Unlock insights & pattern analysis</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary-foreground/60 pointer-events-none" />
                  </div>
                </button>
                <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
              </motion.div>
            )}

            {/* Section 0 — Signal Card */}
            <motion.section variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.06 }}>
              <h2 className="font-serif text-lg font-medium text-foreground mb-3">Your Signal Card</h2>
              <SignalCard />
            </motion.section>

            {/* Section 0a — Strain Fingerprint */}
            <motion.section variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.07 }}>
              <h2 className="font-serif text-lg font-medium text-foreground mb-3">Your Fingerprint</h2>
              <StrainFingerprintCard />
            </motion.section>

            {/* Section 0a — Connoisseur Profile */}
            <motion.section variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.08 }}>
              <h2 className="font-serif text-lg font-medium text-foreground mb-3">Your Profile</h2>
              <ConnoisseurProfileCard />
              <div className="mt-3">
                <ExportReportButton />
              </div>
            </motion.section>

            {/* Section 0b — Connoisseur Points */}
            <motion.section variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
              <ConnoisseurPointsCard />
              <div className="mt-3">
                <RecentUnlocksCard />
              </div>
            </motion.section>

            {/* Section 1 — Achievements */}
            <motion.section variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.12 }}>
              <AchievementBadges />
            </motion.section>

            {/* Section 1b — Terpene Preferences */}
            <motion.section variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.13 }}>
              <h2 className="font-serif text-lg font-medium text-foreground mb-3">Terpene Profile</h2>
              <TerpenePreferenceCard />
            </motion.section>

            {/* Section 1c — Learning Path */}
            <motion.section variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.14 }}>
              <h2 className="font-serif text-lg font-medium text-foreground mb-3">Learning</h2>
              <LearningPathCard />
            </motion.section>

            {/* Section 2 — Feedback */}
            <motion.section variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
              <h2 className="font-serif text-lg font-medium text-foreground mb-3">Feedback</h2>
              <FeedbackSection />
            </motion.section>

            {/* Section 3 — Settings */}
            <motion.section variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
              <h2 className="font-serif text-lg font-medium text-foreground mb-3">Settings</h2>
              <div className="space-y-2">
                <Card className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Community Sharing</p>
                      <p className="text-xs text-muted-foreground">Share anonymous stats</p>
                    </div>
                  </div>
                  <Switch
                    checked={profile?.community_sharing_enabled ?? false}
                    onCheckedChange={async (value) => {
                      try {
                        await updateProfile.mutateAsync({ community_sharing_enabled: value });
                        toast.success(value ? "Sharing enabled" : "Sharing disabled");
                      } catch { toast.error("Failed to update"); }
                    }}
                    disabled={updateProfile.isPending}
                  />
                </Card>
                <Card className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Notification Reminders</p>
                      <p className="text-xs text-muted-foreground">Session logging reminders</p>
                    </div>
                  </div>
                  <Switch />
                </Card>
                <Card className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
                    <div>
                      <p className="text-sm font-medium text-foreground">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">Toggle dark appearance</p>
                    </div>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                </Card>

                {/* More settings link */}
                <button
                  onClick={() => setActiveSection("settings")}
                  className="flex items-center gap-2 text-sm text-primary hover:underline pt-1 pl-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  All settings
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.section>

            {/* Section 4 — Account */}
            <motion.section variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.25 }}>
              <h2 className="font-serif text-lg font-medium text-foreground mb-3">Account</h2>
              <Card className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground truncate">{user?.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Crown className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Subscription</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground">{tier === "premium" ? "Premium" : "Free"}</p>
                      {isPremium && (
                        <Badge className="text-[9px] font-medium border-0 bg-primary/15 text-primary">Active</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {!statsLoading && (
                  <div className="flex gap-4 pt-2 border-t border-border">
                    <div className="text-center flex-1">
                      <p className="text-xl font-serif font-medium text-foreground">{stats?.totalSessions || 0}</p>
                      <p className="text-[11px] text-muted-foreground">Sessions</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-xl font-serif font-medium text-foreground">{stats?.uniqueStrains || 0}</p>
                      <p className="text-[11px] text-muted-foreground">Strains</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-xl font-serif font-medium text-foreground">{stats?.thisWeek || 0}</p>
                      <p className="text-[11px] text-muted-foreground">This Week</p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={openEdit} className="text-xs">
                  <User className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
                </Button>
                <Button variant="outline" size="sm" onClick={() => setActiveSection("privacy")} className="text-xs">
                  <Shield className="w-3.5 h-3.5 mr-1.5" /> Privacy & Data
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 mt-3"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </motion.section>

            {/* Footer */}
            <div className="text-center pt-2 pb-4">
              <p className="text-xs text-muted-foreground">Signal Leaf v1.0.0</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your data is private and secure</p>
            </div>
          </div>
        </div>
      </AppLayout>

      {/* Disclaimer modal */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Disclaimer</DialogTitle>
          </DialogHeader>
          <ul className="text-sm text-muted-foreground space-y-3 py-2">
            {DISCLAIMER_LINES.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Version: {profile?.disclaimer_version ?? "—"} · Accepted:{" "}
            {profile?.disclaimer_accepted_at
              ? new Date(profile.disclaimer_accepted_at).toLocaleDateString()
              : "—"}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDisclaimer(false)} className="w-full">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AchievementUnlockedModal
        achievementKey={unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />
    </>
  );
}
