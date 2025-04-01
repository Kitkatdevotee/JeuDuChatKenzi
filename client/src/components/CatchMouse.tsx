
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Player } from "@/lib/types";

interface CatchMouseProps {
  isOpen: boolean;
  onClose: () => void;
  mice: Player[];
  onCatchMouse: (mouseId: number) => void;
}

export default function CatchMouse({ isOpen, onClose, mice, onCatchMouse }: CatchMouseProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attraper une souris</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] p-4">
          {mice.map((mouse) => (
            <Button
              key={mouse.id}
              onClick={() => onCatchMouse(mouse.id)}
              variant="outline"
              className="w-full mb-2"
            >
              {mouse.username}
            </Button>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
