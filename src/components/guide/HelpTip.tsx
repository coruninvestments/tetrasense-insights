import { useState } from "react";
import { Info } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface HelpTipProps {
  id: string;
  title: string;
  description: string;
}

export function HelpTip({ id, title, description }: HelpTipProps) {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [open, setOpen] = useState(false);

  if (!profile) return null;
  if (!profile.guide_mode_enabled) return null;
  if (profile.dismissed_tip_ids?.includes(id)) return null;

  const handleDismiss = async () => {
    setOpen(false);
    try {
      await updateProfile.mutateAsync({
        dismissed_tip_ids: [...(profile.dismissed_tip_ids || []), id],
      });
    } catch {
      // silent fail — tip just reappears next load
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-primary transition-colors"
        aria-label={`Help: ${title}`}
      >
        <Info className="w-4 h-4" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription className="pt-2">{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button onClick={handleDismiss} className="w-full">
              Got it
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
