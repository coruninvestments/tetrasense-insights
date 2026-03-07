import { useState } from "react";
import { Download, FileText, Table, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeConnoisseurProfile } from "@/lib/connoisseurProfile";
import { exportReport, type ExportFormat } from "@/lib/exportReports";
import { useProfile } from "@/hooks/useProfile";
import { PaywallGate } from "@/components/premium/PaywallGate";
import { toast } from "sonner";

export function ExportReportButton() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const { data: sessions } = useSessionLogs();
  const { data: profileData } = useProfile();

  const handleExport = async (format: ExportFormat) => {
    if (!sessions || sessions.length === 0) {
      toast.error("No sessions to export");
      return;
    }
    setExporting(format);
    try {
      const profile = computeConnoisseurProfile(sessions);
      exportReport(format, {
        sessions,
        profile,
        displayName: profileData?.display_name ?? undefined,
      });
      toast.success(format === "csv" ? "CSV downloaded" : "Report downloaded");
      setOpen(false);
    } catch {
      toast.error("Export failed — please try again");
    } finally {
      setExporting(null);
    }
  };

  const sessionCount = sessions?.length ?? 0;

  return (
    <PaywallGate feature="Export Reports" mode="block">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 w-full"
        onClick={() => setOpen(true)}
        disabled={sessionCount === 0}
      >
        <Download className="w-4 h-4" />
        Export Report
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Export Your Data</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {sessionCount} session{sessionCount !== 1 ? "s" : ""} available
            </p>
          </DialogHeader>

          <div className="space-y-2.5 pt-2">
            <ExportOption
              icon={FileText}
              label="Full Report"
              description="Styled HTML report with profile, dose patterns, terpenes & session history"
              format="pdf"
              loading={exporting === "pdf"}
              disabled={!!exporting}
              onExport={handleExport}
            />
            <ExportOption
              icon={Table}
              label="Raw Data (CSV)"
              description="Spreadsheet-ready export of all session logs"
              format="csv"
              loading={exporting === "csv"}
              disabled={!!exporting}
              onExport={handleExport}
            />
          </div>

          <p className="text-[10px] text-muted-foreground text-center pt-2">
            Your data stays on your device — nothing is shared.
          </p>
        </DialogContent>
      </Dialog>
    </PaywallGate>
  );
}

function ExportOption({
  icon: Icon,
  label,
  description,
  format,
  loading,
  disabled,
  onExport,
}: {
  icon: typeof FileText;
  label: string;
  description: string;
  format: ExportFormat;
  loading: boolean;
  disabled: boolean;
  onExport: (f: ExportFormat) => void;
}) {
  return (
    <button
      onClick={() => onExport(format)}
      disabled={disabled}
      className="w-full flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left disabled:opacity-50"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        {loading ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : (
          <Icon className="w-4 h-4 text-primary" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
          {description}
        </p>
      </div>
    </button>
  );
}
