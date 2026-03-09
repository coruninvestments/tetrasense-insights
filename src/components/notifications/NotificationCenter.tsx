import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CheckCheck, Trash2, Clock, Leaf, BarChart3, Award, Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getNotifications,
  markAsRead,
  markAllRead,
  clearAllNotifications,
  type AppNotification,
  type NotificationType,
  NOTIFICATION_TYPE_META,
} from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<NotificationType, React.ElementType> = {
  log_reminder: Clock,
  weekly_report: BarChart3,
  new_unlock: Award,
  challenge_progress: Target,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificationCenter({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<NotificationType | "all">("all");

  useEffect(() => {
    if (open) setNotifications(getNotifications());
  }, [open]);

  const filtered = filter === "all"
    ? notifications
    : notifications.filter((n) => n.type === filter);

  const handleRead = (id: string) => setNotifications(markAsRead(id));
  const handleReadAll = () => setNotifications(markAllRead());
  const handleClearAll = () => setNotifications(clearAllNotifications());

  const handleCta = (n: AppNotification) => {
    handleRead(n.id);
    if (n.ctaPath) {
      onClose();
      navigate(n.ctaPath);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] bg-card border-t border-border rounded-t-2xl overflow-hidden flex flex-col safe-bottom"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-serif text-lg font-medium text-foreground">Notifications</h2>
              <div className="flex items-center gap-1">
                {notifications.some((n) => !n.read) && (
                  <Button variant="ghost" size="sm" onClick={handleReadAll} className="text-xs">
                    <CheckCheck className="w-3.5 h-3.5 mr-1" /> Read all
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-muted-foreground">
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} className="ml-1">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
              {(["all", "log_reminder", "weekly_report", "new_unlock", "challenge_progress"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {key === "all" ? "All" : NOTIFICATION_TYPE_META[key].label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2">
              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <Leaf className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">We'll let you know when something happens</p>
                </div>
              ) : (
                filtered.map((n) => {
                  const Icon = typeIcons[n.type];
                  const meta = NOTIFICATION_TYPE_META[n.type];
                  return (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`relative p-4 rounded-xl border transition-colors cursor-pointer ${
                        n.read
                          ? "bg-card border-border"
                          : "bg-accent/30 border-primary/20"
                      }`}
                      onClick={() => handleRead(n.id)}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-0.5 ${meta.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-foreground">{n.title}</span>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-muted-foreground/60">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </span>
                            {n.ctaLabel && (
                              <Button
                                variant="soft"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCta(n);
                                }}
                              >
                                {n.ctaLabel}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
