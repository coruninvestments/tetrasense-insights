import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ThumbsUp, Minus, ThumbsDown, CheckCircle, AlertTriangle, Sparkles, ArrowRight, Info } from "lucide-react";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompareModal } from "@/components/session/CompareModal";
import { useSession } from "@/hooks/useSession";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";
import { generateSessionReplay, getKeyEffects, type SimilarSession } from "@/lib/sessionReplay";
import { logEvent } from "@/lib/analytics";

const outcomeMeta = {
  positive: { label: "Good", icon: ThumbsUp, color: "bg-primary/10 text-primary", border: "border-primary/20" },
  neutral: { label: "Okay", icon: Minus, color: "bg-muted text-muted-foreground", border: "border-border" },
  negative: { label: "Poor", icon: ThumbsDown, color: "bg-destructive/10 text-destructive", border: "border-destructive/20" },
};

const confidenceColors = {
  low: "bg-muted text-muted-foreground",
  med: "bg-accent text-accent-foreground",
  high: "bg-primary/10 text-primary",
};

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading, error } = useSession(id);
  const { data: allSessions } = useSessionLogs();
  const [compareSession, setCompareSession] = useState<SimilarSession | null>(null);

  useEffect(() => {
    logEvent("viewed_session_replay" as any);
  }, []);

  const replay = useMemo(() => {
    if (!session || !allSessions) return null;
    return generateSessionReplay(session, allSessions);
  }, [session, allSessions]);

  const keyEffects = useMemo(() => {
    if (!session) return null;
    return getKeyEffects(session);
  }, [session]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-5 pt-12 pb-8 safe-top space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (error || !session) {
    return (
      <AppLayout>
        <div className="px-5 pt-12 safe-top">
          <EmptyState
            title="Session not found"
            description="This session doesn't exist or you don't have access to it."
            actionLabel="Go home"
            actionTo="/"
          />
        </div>
      </AppLayout>
    );
  }

  const outcome = normalizeOutcome(session.outcome);
  const meta = outcomeMeta[outcome];
  const OutcomeIcon = meta.icon;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="px-5 pt-12 pb-4 safe-top">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-lg font-semibold text-foreground">Session Replay</h1>
          </motion.div>
        </header>

        <div className="px-5 space-y-4 pb-8">
          {/* Session Summary Card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className={`border ${meta.border}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${meta.color}`}>
                    <OutcomeIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{meta.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(session.created_at), "MMM d, yyyy · h:mm a")}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize text-xs">{session.intent}</Badge>
                  <Badge variant="outline" className="text-xs">{session.strain_name_text}</Badge>
                  <Badge variant="outline" className="capitalize text-xs">{session.method}</Badge>
                  {session.dose_level && (
                    <Badge variant="outline" className="capitalize text-xs">{session.dose_level} dose</Badge>
                  )}
                </div>

                {/* Clarity Snapshot */}
                {keyEffects && (keyEffects.top3Positive.length > 0 || keyEffects.top2Negative.length > 0) && (
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Key Effects</p>
                    <div className="flex flex-wrap gap-1.5">
                      {keyEffects.top3Positive.map(e => (
                        <span key={e.name} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {e.name} {e.value}/10
                        </span>
                      ))}
                      {keyEffects.top2Negative.map(e => (
                        <span key={e.name} className="text-[11px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                          {e.name} {e.value}/10
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sensory Profile */}
                {(session.aroma_tags?.length > 0 || session.flavor_tags?.length > 0 || session.inhale_quality || session.aftertaste || session.sensory_enjoyment) && (
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Flavor & Aroma</p>
                    <div className="flex flex-wrap gap-1.5">
                      {session.aroma_tags?.map((t: string) => (
                        <span key={`a-${t}`} className="text-[11px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full capitalize">
                          🌿 {t}
                        </span>
                      ))}
                      {session.flavor_tags?.map((t: string) => (
                        <span key={`f-${t}`} className="text-[11px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full capitalize">
                          👅 {t}
                        </span>
                      ))}
                      {session.inhale_quality && (
                        <span className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full capitalize">
                          Inhale: {session.inhale_quality}
                        </span>
                      )}
                      {session.aftertaste && (
                        <span className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full capitalize">
                          Aftertaste: {session.aftertaste}
                        </span>
                      )}
                      {session.sensory_enjoyment && (
                        <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Enjoyment: {session.sensory_enjoyment}/5
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Why Section */}
          {replay && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h2 className="font-serif text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Why this likely happened
                  </h2>
                  <div className="space-y-2.5">
                    {replay.why.map((bullet, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                          bullet.type === "positive" ? "bg-primary/10" : "bg-warning/10"
                        }`}>
                          {bullet.type === "positive"
                            ? <CheckCircle className="w-3 h-3 text-primary" />
                            : <AlertTriangle className="w-3 h-3 text-warning" />
                          }
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{bullet.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{bullet.evidence}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Next Time Section */}
          {replay && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h2 className="font-serif text-sm font-semibold text-foreground flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    Next time
                  </h2>
                  <div className="space-y-2.5">
                    {replay.next.map((suggestion, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className={`shrink-0 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${confidenceColors[suggestion.confidence]}`}>
                          {suggestion.confidence}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-foreground">{suggestion.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{suggestion.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Similar Sessions */}
          {replay && replay.similar.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h2 className="font-serif text-sm font-semibold text-foreground">Similar Sessions</h2>
                  <div className="space-y-1.5">
                    {replay.similar.map(sim => {
                      const sOutcome = normalizeOutcome(sim.session.outcome);
                      const sMeta = outcomeMeta[sOutcome];
                      return (
                        <button
                          key={sim.session.id}
                          onClick={() => {
                            logEvent("tapped_similar_session" as any);
                            setCompareSession(sim);
                            logEvent("opened_compare" as any);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-secondary/50 transition-colors text-left"
                        >
                          <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${sMeta.color}`}>
                            {(() => { const I = sMeta.icon; return <I className="w-3.5 h-3.5" />; })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground capitalize truncate">
                              {sim.session.intent} · {sim.session.strain_name_text}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(sim.session.created_at), "MMM d")} · {sim.session.method} · {sim.session.dose_level ?? "—"}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground">Compare →</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Disclaimer */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground text-center py-2">
              <Info className="w-3 h-3" />
              Pattern-based insights. Not medical advice.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Compare Modal */}
      {compareSession && (
        <CompareModal
          open={!!compareSession}
          onOpenChange={(open) => !open && setCompareSession(null)}
          sessionA={session}
          sessionB={compareSession.session}
        />
      )}
    </AppLayout>
  );
};

export default SessionDetail;
