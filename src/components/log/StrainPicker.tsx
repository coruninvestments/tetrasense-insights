import { useState } from "react";
import { Search, Plus, Check, Loader2 } from "lucide-react";
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
import { useStrains, useCreatePendingStrain, formatPotencyRange } from "@/hooks/useStrains";
import { toast } from "sonner";

interface StrainPickerProps {
  value: string;
  selectedStrainId: string | null;
  onSelect: (name: string, id: string | null, isPending?: boolean) => void;
}

const typeColors = {
  Indica: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Sativa: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Hybrid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export function StrainPicker({ value, selectedStrainId, onSelect }: StrainPickerProps) {
  const [search, setSearch] = useState(value);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newStrainName, setNewStrainName] = useState("");
  const [newStrainType, setNewStrainType] = useState("Hybrid");
  
  const { data: strains, isLoading } = useStrains(search);
  const createPendingStrain = useCreatePendingStrain();

  const handleSearchChange = (text: string) => {
    setSearch(text);
    // Clear selection if user types something new
    if (selectedStrainId && text !== value) {
      onSelect(text, null);
    }
  };

  const handleSelectStrain = (name: string, id: string) => {
    setSearch(name);
    onSelect(name, id);
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
      
      toast.success("Strain suggestion submitted! You can use it in your session.");
      setShowAddDialog(false);
      setSearch(strain.name);
      onSelect(strain.name, strain.id, true);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit strain");
    }
  };

  const suggestions = strains?.slice(0, 6) || [];
  const hasExactMatch = suggestions.some(
    s => s.name.toLowerCase() === search.toLowerCase()
  );

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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Suggestions */}
      {!isLoading && suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((strain) => (
            <button
              key={strain.id}
              onClick={() => handleSelectStrain(strain.name, strain.id)}
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
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Pending
                      </span>
                    )}
                    {selectedStrainId === strain.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  {strain.matchedAlias && (
                    <span className="text-xs text-muted-foreground">
                      Also known as: {strain.matchedAlias}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      typeColors[strain.type as keyof typeof typeColors] || "bg-secondary"
                    }`}
                  >
                    {strain.type}
                  </span>
                  {(strain.thc_min !== null || strain.thc_max !== null) && (
                    <span className="text-xs text-muted-foreground">
                      THC {formatPotencyRange(strain.thc_min, strain.thc_max)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results or add custom */}
      {!isLoading && search.length >= 2 && !hasExactMatch && (
        <Card className="p-4 border-dashed">
          <p className="text-sm text-muted-foreground mb-3">
            Can't find "{search}"?
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCustom}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add as custom strain
          </Button>
        </Card>
      )}

      {/* Use typed name without selecting */}
      {search && !selectedStrainId && suggestions.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Or continue with "{search}" as custom entry
        </p>
      )}

      {/* Add Custom Strain Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit New Strain</DialogTitle>
            <DialogDescription>
              Your submission will be added as a custom strain for your sessions. 
              It may be reviewed and added to the public library later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Strain Name</label>
              <Input
                value={newStrainName}
                onChange={(e) => setNewStrainName(e.target.value)}
                placeholder="e.g., Purple Haze"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={newStrainType} onValueChange={setNewStrainType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Indica">Indica</SelectItem>
                  <SelectItem value="Sativa">Sativa</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowAddDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSubmitCustomStrain}
              disabled={createPendingStrain.isPending}
            >
              {createPendingStrain.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
