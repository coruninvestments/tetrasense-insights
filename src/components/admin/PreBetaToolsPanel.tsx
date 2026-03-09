import { useState } from "react";
import {
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Star, Shield,
  FileSearch, Trash2, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ConfirmDangerActionModal } from "./ConfirmDangerActionModal";
import {
  fetchDryRunReport, fetchReadinessReport, assignFounderIdentity, requestBetaReset,
  type DryRunReport, type ReadinessReport,
} from "@/lib/preBetaTools";

export function PreBetaToolsPanel() {
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);
  const [dryRun, setDryRun] = useState<DryRunReport | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [identityUserId, setIdentityUserId] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState<"creator" | "developer" | null>(null);

  const runReadiness = async () => {
    setLoading("readiness");
    try {
      const r = await fetchReadinessReport();
      setReadiness(r);
      toast.success("Readiness check complete");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(null); }
  };

  const runDryRun = async () => {
    setLoading("dryrun");
    try {
      const r = await fetchDryRunReport();
      setDryRun(r);
      toast.success("Dry run complete — nothing was deleted");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(null); }
  };

  const handleAssignIdentity = async (role: "creator" | "developer") => {
    if (!identityUserId.trim()) { toast.error("Enter a user ID"); return; }
    try {
      await assignFounderIdentity(identityUserId.trim(), role);
      toast.success(`Assigned ${role} role successfully`);
      setShowIdentityModal(null);
      setIdentityUserId("");
    } catch (e: any) {
      toast.error(e.message);
      throw e;
    }
  };

  const handleBetaReset = async () => {
    try {
      const result = await requestBetaReset("RESET FOR BETA");
      if (result.success) {
        toast.success("Beta reset executed");
      } else {
        toast.info(result.message);
      }
    } catch (e: any) {
      toast.error(e.message);
      throw e;
    }
  };

  const CheckItem = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center gap-2 py-1">
      {ok ? <CheckCircle className="w-3.5 h-3.5 text-primary" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
      <span className={`text-xs ${ok ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Readiness Checker ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Beta Readiness</p>
            <Button variant="outline" size="sm" onClick={runReadiness} disabled={loading === "readiness"} className="gap-1.5 text-xs">
              {loading === "readiness" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Check
            </Button>
          </div>
          {readiness ? (
            <div className="space-y-0.5">
              <CheckItem ok={readiness.unresolvedTickets === 0} label={`Support tickets reviewed (${readiness.unresolvedTickets} unresolved)`} />
              <CheckItem ok={readiness.totalUsers > 0} label={`Test users identified (${readiness.totalUsers} total)`} />
              <CheckItem ok={readiness.totalSessions > 0} label={`Test data present (${readiness.totalSessions} sessions)`} />
              <CheckItem ok={readiness.founderBadges > 0} label={`Founder badges configured (${readiness.founderBadges})`} />
              <CheckItem ok={readiness.creatorAccounts > 0} label={`Creator accounts (${readiness.creatorAccounts})`} />
              <CheckItem ok={readiness.devAccounts > 0} label={`Developer accounts (${readiness.devAccounts})`} />
              <CheckItem ok={false} label="Visual asset review (manual)" />
              <CheckItem ok={false} label="Analytics export (manual)" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Run the check to see readiness status.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Assign Founder Identity ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Assign Founder Identity</p>
          <p className="text-xs text-muted-foreground">Assign Creator or Developer role to a user by their UUID.</p>
          <div className="space-y-1.5">
            <Label htmlFor="identity-uid" className="text-xs">User ID</Label>
            <Input
              id="identity-uid"
              value={identityUserId}
              onChange={(e) => setIdentityUserId(e.target.value)}
              placeholder="UUID of the user"
              className="font-mono text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm" className="gap-1.5 text-xs flex-1"
              onClick={() => setShowIdentityModal("creator")}
              disabled={!identityUserId.trim()}
            >
              <Star className="w-3.5 h-3.5" /> Creator
            </Button>
            <Button
              variant="outline" size="sm" className="gap-1.5 text-xs flex-1"
              onClick={() => setShowIdentityModal("developer")}
              disabled={!identityUserId.trim()}
            >
              <Shield className="w-3.5 h-3.5" /> Developer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Dry Run Reset ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Dry Run Reset</p>
            <Button variant="outline" size="sm" onClick={runDryRun} disabled={loading === "dryrun"} className="gap-1.5 text-xs">
              {loading === "dryrun" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSearch className="w-3.5 h-3.5" />}
              Run
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Preview what a beta reset would remove. Nothing is deleted.</p>
          {dryRun && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: "Users", value: dryRun.users },
                { label: "Sessions", value: dryRun.sessions },
                { label: "Tickets", value: dryRun.tickets },
                { label: "Achievements", value: dryRun.achievements },
                { label: "Analytics", value: dryRun.analytics },
                { label: "Draft Batches", value: dryRun.draftBatches },
                { label: "Feedback", value: dryRun.feedback },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <Badge variant="secondary" className="text-xs font-mono">{value}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Danger Zone ── */}
      <Card className="border-destructive/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <p className="text-sm font-medium text-destructive">Danger Zone</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Reset all data for beta launch. Requires typed confirmation. Currently stubbed — no data will be deleted.
          </p>
          <Button
            variant="destructive" size="sm" className="gap-1.5 text-xs"
            onClick={() => setShowResetModal(true)}
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset for Beta
          </Button>
        </CardContent>
      </Card>

      {/* ── Modals ── */}
      {showIdentityModal && (
        <ConfirmDangerActionModal
          open
          onClose={() => setShowIdentityModal(null)}
          title={`Assign ${showIdentityModal === "creator" ? "Creator" : "Developer"} Role`}
          description={`This will grant the ${showIdentityModal} role to user ${identityUserId}.`}
          onConfirm={() => handleAssignIdentity(showIdentityModal)}
          destructive={false}
        />
      )}

      <ConfirmDangerActionModal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset for Beta"
        description="This will remove all test data. This action is irreversible once implemented."
        confirmPhrase="RESET FOR BETA"
        onConfirm={handleBetaReset}
        destructive
      />
    </div>
  );
}
