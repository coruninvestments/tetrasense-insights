import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Eye, FlaskConical, Dna } from "lucide-react";
import type { ReviewQueueItem } from "@/lib/coaReview";

const statusColor: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  draft: "bg-muted text-muted-foreground border-border",
  verified: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

interface Props {
  items: ReviewQueueItem[];
  onSelect: (item: ReviewQueueItem) => void;
}

export function COAReviewTable({ items, onSelect }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">No batches match filters</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="hidden sm:table-cell">Lab</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Chemistry</TableHead>
          <TableHead className="hidden sm:table-cell">Date</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className="cursor-pointer" onClick={() => onSelect(item)}>
            <TableCell>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{item.product_name}</p>
                {item.brand_name && (
                  <p className="text-xs text-muted-foreground truncate">{item.brand_name}</p>
                )}
                {item.strain_name && (
                  <p className="text-xs text-muted-foreground/70 truncate">{item.strain_name}</p>
                )}
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <span className="text-xs text-muted-foreground">{item.lab_name || "—"}</span>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={`text-[10px] ${statusColor[item.verification_status] || ""}`}>
                {item.verification_status}
              </Badge>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <FlaskConical className="w-3 h-3" /> {item.terpene_count}
                </span>
                <span className="flex items-center gap-0.5">
                  <Dna className="w-3 h-3" /> {item.cannabinoid_count}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <span className="text-xs text-muted-foreground">
                {format(new Date(item.created_at), "MMM d")}
              </span>
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
