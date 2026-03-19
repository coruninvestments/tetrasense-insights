import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { fetchReviewQueue, fetchReviewStats, type ReviewQueueItem } from "@/lib/coaReview";
import { COAReviewTable } from "@/components/admin/COAReviewTable";
import { COAReviewDetailModal } from "@/components/admin/COAReviewDetailModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldCheck, Clock, XCircle, FileCheck } from "lucide-react";

const STATUS_FILTERS = [
  { value: null, label: "All" },
  { value: "pending", label: "Pending" },
  { value: "draft", label: "Draft" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
] as const;

export default function COAReviewQueue() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [labFilter, setLabFilter] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-review-queue", statusFilter, labFilter],
    queryFn: () => fetchReviewQueue(statusFilter, labFilter || null),
    enabled: isAdmin === true,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-review-stats"],
    queryFn: fetchReviewStats,
    enabled: isAdmin === true,
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const handleSelect = (item: ReviewQueueItem) => {
    setSelectedBatchId(item.id);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-semibold text-foreground">COA Review Queue</h1>
          <p className="text-sm text-muted-foreground">
            Review, edit, and verify imported batch chemistry.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-lg font-semibold">{stats.pending}</p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold">{stats.draft}</p>
                  <p className="text-[10px] text-muted-foreground">Draft</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-lg font-semibold">{stats.verified}</p>
                  <p className="text-[10px] text-muted-foreground">Verified</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-lg font-semibold">{stats.rejected}</p>
                  <p className="text-[10px] text-muted-foreground">Rejected</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.label}
              variant={statusFilter === f.value ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
          <Input
            value={labFilter}
            onChange={(e) => setLabFilter(e.target.value)}
            placeholder="Filter by lab..."
            className="h-7 text-xs w-36"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {items.length} batch{items.length !== 1 ? "es" : ""}
            </p>
            <COAReviewTable items={items} onSelect={handleSelect} />
          </>
        )}
      </div>

      <COAReviewDetailModal
        batchId={selectedBatchId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
