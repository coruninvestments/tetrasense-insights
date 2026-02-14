import { useState } from "react";
import { motion } from "framer-motion";
import { User, Settings, Shield, Bell, ChevronRight, LogOut, Crown, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useSessionStats } from "@/hooks/useSessionLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PrivacyCommunitySection } from "@/components/profile/PrivacyCommunitySection";

type Section = "main" | "edit" | "notifications" | "privacy" | "settings";

const menuItems: { icon: React.ElementType; label: string; section: Section }[] = [
  { icon: User, label: "Edit Profile", section: "edit" },
  { icon: Bell, label: "Notifications", section: "notifications" },
  { icon: Shield, label: "Privacy & Data", section: "privacy" },
  { icon: Settings, label: "Settings", section: "settings" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats, isLoading: statsLoading } = useSessionStats();
  const updateProfile = useUpdateProfile();
  const [activeSection, setActiveSection] = useState<Section>("main");

  const isPremium = profile?.is_premium || false;

  // Edit profile form state
  const [displayName, setDisplayName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [weightRange, setWeightRange] = useState("");

  const openEdit = () => {
    setDisplayName(profile?.display_name || "");
    setAgeRange(profile?.age_range || "");
    setWeightRange(profile?.weight_range || "");
    setActiveSection("edit");
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName || null,
        age_range: ageRange || null,
        weight_range: weightRange || null,
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

  if (activeSection !== "main") {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background">
          <header className="px-5 pt-12 pb-4 safe-top flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setActiveSection("main")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-xl font-medium text-foreground">
              {menuItems.find((m) => m.section === activeSection)?.label}
            </h1>
          </header>

          <div className="px-5 pb-8 space-y-6">
            {activeSection === "edit" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ageRange">Age Range</Label>
                  <Select value={ageRange} onValueChange={setAgeRange}>
                    <SelectTrigger><SelectValue placeholder="Select age range" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18-24">18–24</SelectItem>
                      <SelectItem value="25-34">25–34</SelectItem>
                      <SelectItem value="35-44">35–44</SelectItem>
                      <SelectItem value="45-54">45–54</SelectItem>
                      <SelectItem value="55+">55+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weightRange">Weight Range</Label>
                  <Select value={weightRange} onValueChange={setWeightRange}>
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
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Card variant="default" className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Session Reminders</p>
                    <p className="text-xs text-muted-foreground">Get reminded to log your sessions</p>
                  </div>
                  <Switch />
                </Card>
                <Card variant="default" className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Weekly Insights</p>
                    <p className="text-xs text-muted-foreground">Receive your weekly summary</p>
                  </div>
                  <Switch />
                </Card>
                <Card variant="default" className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">New Strains</p>
                    <p className="text-xs text-muted-foreground">Get notified about new strains</p>
                  </div>
                  <Switch />
                </Card>
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
                <Card variant="default" className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Anonymous Data Sharing</p>
                    <p className="text-xs text-muted-foreground">Help improve community insights</p>
                  </div>
                  <Switch />
                </Card>
                <Card variant="default" className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Profile Visibility</p>
                    <p className="text-xs text-muted-foreground">Allow others to see your stats</p>
                  </div>
                  <Switch defaultChecked={false} />
                </Card>
                <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                  Export My Data
                </Button>
                <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                  Delete My Account
                </Button>
              </motion.div>
            )}

            {activeSection === "settings" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Card variant="default" className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Toggle dark appearance</p>
                  </div>
                  <Switch defaultChecked />
                </Card>
                <Card variant="default" className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Units</p>
                    <p className="text-xs text-muted-foreground">Measurement system</p>
                  </div>
                  <Select defaultValue="imperial">
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imperial">Imperial</SelectItem>
                      <SelectItem value="metric">Metric</SelectItem>
                    </SelectContent>
                  </Select>
                </Card>

                {/* Help / Onboarding */}
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-4">Help & Onboarding</h3>
                <Card variant="default" className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Guide Mode</p>
                    <p className="text-xs text-muted-foreground">Show helpful explanations throughout the app</p>
                  </div>
                  <Switch
                    checked={profile?.guide_mode_enabled ?? true}
                    onCheckedChange={async (value) => {
                      try {
                        await updateProfile.mutateAsync({ guide_mode_enabled: value });
                        toast.success(value ? "Guide Mode enabled" : "Guide Mode disabled");
                      } catch {
                        toast.error("Failed to update preference");
                      }
                    }}
                    disabled={updateProfile.isPending}
                  />
                </Card>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={updateProfile.isPending || (profile?.dismissed_tip_ids?.length ?? 0) === 0}
                  onClick={async () => {
                    try {
                      await updateProfile.mutateAsync({ dismissed_tip_ids: [] });
                      toast.success("All tips have been reset");
                    } catch {
                      toast.error("Failed to reset tips");
                    }
                  }}
                >
                  Reset Tips
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <header className="px-5 pt-12 pb-6 safe-top">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              {profileLoading ? (
                <Skeleton className="h-6 w-32 mb-1" />
              ) : (
                <h1 className="font-serif text-xl font-medium text-foreground">
                  {profile?.display_name || user?.email?.split("@")[0] || "Welcome"}
                </h1>
              )}
              <p className="text-sm text-muted-foreground">
                {isPremium ? "Premium Member" : "Free Account"}
              </p>
            </div>
          </motion.div>
        </header>

        <div className="px-5 pb-8 space-y-6">
          {/* Premium CTA */}
          {!isPremium && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="gradient-primary border-0 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-primary-foreground mb-0.5">Upgrade to Premium</h3>
                    <p className="text-sm text-primary-foreground/80">Unlock insights & pattern analysis</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary-foreground/60" />
                </div>
              </Card>
            </motion.div>
          )}

          {/* Usage Stats */}
          <section>
            <h2 className="font-serif text-lg font-medium text-foreground mb-4">Your Journey</h2>
            <div className="grid grid-cols-3 gap-3">
              {statsLoading ? (
                <>
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </>
              ) : (
                <>
                  <Card variant="glass" className="p-4 text-center">
                    <p className="text-2xl font-serif font-medium text-foreground">{stats?.totalSessions || 0}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </Card>
                  <Card variant="glass" className="p-4 text-center">
                    <p className="text-2xl font-serif font-medium text-foreground">{stats?.thisWeek || 0}</p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </Card>
                  <Card variant="glass" className="p-4 text-center">
                    <p className="text-2xl font-serif font-medium text-foreground">{stats?.uniqueStrains || 0}</p>
                    <p className="text-xs text-muted-foreground">Strains</p>
                  </Card>
                </>
              )}
            </div>
          </section>

          {/* Menu */}
          <section>
            <Card variant="default" className="overflow-hidden divide-y divide-border">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.section}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => item.section === "edit" ? openEdit() : setActiveSection(item.section)}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors w-full text-left"
                  >
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </motion.div>
              ))}
            </Card>
          </section>

          {/* Sign Out */}
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">TetraSense v1.0.0</p>
            <p className="text-xs text-muted-foreground mt-1">Your data is private and secure</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
