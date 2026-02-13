import { useState } from "react";
import { Search, Plus, Check, Loader2, Shield, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCanonicalStrains, type CanonicalStrain } from "@/hooks/useCanonicalStrains";
import { useStrains, useCreatePendingStrain, formatPotencyRange } from "@/hooks/useStrains";
import { toast } from "sonner";

export interface StrainSelection {
  strainText: string;
  canonicalStrainId: string | null;
  legacyStrainId: string | null;
  isPersonalOnly: boolean;
}

interface StrainPickerProps {
  value: string;
  selectedStrainId: string | null;
  canonicalStrainId?: string | null;
  onSelect: (name: string, id: string | null, canonicalId?: string | null) => void;
}

const typeColors = {
  Indica: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  indica: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Sativa: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  sativa: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Hybrid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  hybrid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export function StrainPicker({ value, selectedStrainId, canonicalStrainId, onSelect }: StrainPickerProps) {
  const [search, setSearch] = useState(value);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newStrainName, setNewStrainName] = useState("");
  const [newStrainType, setNewStrainType] = useState("Hybrid");

  // Search both canonical and legacy strains
  const { data: canonicalStrains, isLoading: loadingCanonical } = useCanonicalStrains(search);
  const { data: legacyStrains, isLoading: loadingLegacy } = useStrains(search);
  const createPendingStrain = useCreatePendingStrain();

  const isLoading = loadingCanonical || loadingLegacy;

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if ((selectedStrainId || canonicalStrainId) && text !== value) {
      onSelect(text, null, null);
    }
  };

  const handleSelectCanonical = (strain: CanonicalStrain) => {
    setSearch(strain.canonical_name);
    onSelect(strain.canonical_name, null, strain.id);
  };

  const handleSelectLegacy = (name: string, id: string) => {
    setSearch(name);
    onSelect(name, id, null);
  };

  const handleAddCustom = () => {
    setNewStrainName(search);
    setShowAddDialog(true);
  };

  const handleSubmitCustomStrain = async () => {
    if (!newStrainName.trim()) {
      toast.error("Please enter a strain name");
      return;
    }
    try {
      const strain = await createPendingStrain.mutateAsync({
        name: newStrainName.trim(),
        type: newStrainType,
      });
      toast.success("Strain suggestion submitted!");
      setShowAddDialog(false);
      setSearch(strain.name);
      onSelect(strain.name, strain.id, null);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit strain");
    }
  };

  const canonicalSuggestions = canonicalStrains?.slice(0, 4) || [];
  const legacySuggestions = (legacyStrains || [])
    .filter(s => !canonicalSuggestions.some(c => c.canonical_name.toLowerCase() === s.name.toLowerCase()))
    .slice(0, 4);

  const hasExactMatch = [
    ...canonicalSuggestions.map(s => s.canonical_name),
    ...legacySuggestions.map(s => s.name),
  ].some(n => n.toLowerCase() === search.toLowerCase());

  const isPersonalOnly = !!(search && !canonicalStrainId && !selectedStrainId);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search strains..."
          className="h-14 pl-12"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Canonical strain results */}
      {!isLoading && canonicalSuggestions.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Canonical Library</span>
          {canonicalSuggestions.map((strain) => (
            <button
              key={strain.id}
              onClick={() => handleSelectCanonical(strain)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                canonicalStrainId === strain.id
                  ? "bg-primary/10 ring-2 ring-primary"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{strain.canonical_name}</span>
                    {strain.is_verified && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">✓ Verified</span>
                    )}
                    {canonicalStrainId === strain.id && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  {strain.matchedAlias && (
                    <span className="text-xs text-muted-foreground">Also known as: {strain.matchedAlias}</span>
                  )}
                </div>
                {strain.strain_type && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[strain.strain_type as keyof typeof typeColors] || "bg-secondary"}`}>
                    {strain.strain_type}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Legacy strain results */}
      {!isLoading && legacySuggestions.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Strain Library</span>
          {legacySuggestions.map((strain) => (
            <button
              key={strain.id}
              onClick={() => handleSelectLegacy(strain.name, strain.id)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                selectedStrainId === strain.id
                  ? "bg-primary/10 ring-2 ring-primary"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{strain.name}</span>
                    {strain.is_pending && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Pending</span>
                    )}
                    {selectedStrainId === strain.id && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  {strain.matchedAlias && (
                    <span className="text-xs text-muted-foreground">Also known as: {strain.matchedAlias}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[strain.type as keyof typeof typeColors] || "bg-secondary"}`}>
                    {strain.type}
                  </span>
                  {(strain.thc_min !== null || strain.thc_max !== null) && (
                    <span className="text-xs text-muted-foreground">THC {formatPotencyRange(strain.thc_min, strain.thc_max)}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results / add custom */}
      {!isLoading && search.length >= 2 && !hasExactMatch && (
        <Card className="p-4 border-dashed">
          <p className="text-sm text-muted-foreground mb-3">Can't find "{search}"?</p>
          <Button variant="outline" size="sm" onClick={handleAddCustom} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Add as custom strain
          </Button>
        </Card>
      )}

      {/* Privacy label */}
      {search && (canonicalStrainId || isPersonalOnly) && (
        <div className={`flex items-center gap-2 p-2 rounded-lg ${isPersonalOnly ? "bg-muted" : "bg-primary/5"}`}>
          {isPersonalOnly ? (
            <>
              <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Personal-only (never used for community stats).</span>
            </>
          ) : (
            <>
              <Users className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">Library strain (eligible for aggregate stats if you opt in).</span>
            </>
          )}
        </div>
      )}

      {/* Use typed name without selecting */}
      {search && !selectedStrainId && !canonicalStrainId && (canonicalSuggestions.length > 0 || legacySuggestions.length > 0) && (
        <p className="text-xs text-muted-foreground text-center">Or continue with "{search}" as personal entry</p>
      )}

      {/* Add Custom Strain Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit New Strain</DialogTitle>
            <DialogDescription>
              Your submission will be added as a custom strain for your sessions. It may be reviewed and added to the public library later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Strain Name</label>
              <Input value={newStrainName} onChange={(e) => setNewStrainName(e.target.value)} placeholder="e.g., Purple Haze" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={newStrainType} onValueChange={setNewStrainType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Indica">Indica</SelectItem>
                  <SelectItem value="Sativa">Sativa</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleSubmitCustomStrain} disabled={createPendingStrain.isPending}>
              {createPendingStrain.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
