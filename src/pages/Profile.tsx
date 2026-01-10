import { motion } from "framer-motion";
import { User, Settings, Shield, Bell, ChevronRight, LogOut, Crown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSessionStats } from "@/hooks/useSessionLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const menuItems = [
  { icon: User, label: "Edit Profile", path: "/profile/edit" },
  { icon: Bell, label: "Notifications", path: "/profile/notifications" },
  { icon: Shield, label: "Privacy & Data", path: "/profile/privacy" },
  { icon: Settings, label: "Settings", path: "/profile/settings" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats, isLoading: statsLoading } = useSessionStats();

  const isPremium = profile?.is_premium || false;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <header className="px-5 pt-12 pb-6 safe-top">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="gradient-primary border-0 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-primary-foreground mb-0.5">
                      Upgrade to Premium
                    </h3>
                    <p className="text-sm text-primary-foreground/80">
                      Unlock insights & pattern analysis
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary-foreground/60" />
                </div>
              </Card>
            </motion.div>
          )}

          {/* Usage Stats */}
          <section>
            <h2 className="font-serif text-lg font-medium text-foreground mb-4">
              Your Journey
            </h2>
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
                    <p className="text-2xl font-serif font-medium text-foreground">
                      {stats?.totalSessions || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </Card>
                  <Card variant="glass" className="p-4 text-center">
                    <p className="text-2xl font-serif font-medium text-foreground">
                      {stats?.thisWeek || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </Card>
                  <Card variant="glass" className="p-4 text-center">
                    <p className="text-2xl font-serif font-medium text-foreground">
                      {stats?.uniqueStrains || 0}
                    </p>
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
                  key={item.path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={item.path}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Link>
                </motion.div>
              ))}
            </Card>
          </section>

          {/* Sign Out */}
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              TetraSense v1.0.0
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your data is private and secure
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
