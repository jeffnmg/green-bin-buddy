import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Sparkles } from "lucide-react";

interface LevelUpCelebrationProps {
  show: boolean;
  newLevel: number;
  onClose: () => void;
}

export function LevelUpCelebration({ show, newLevel, onClose }: LevelUpCelebrationProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (show) {
      setIsOpen(true);
    }
  }, [show]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="text-center border-primary/20 bg-card">
        <div className="py-6 space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute animate-confetti">
              <Sparkles className="w-16 h-16 text-primary/30" />
            </div>
            <div className="w-20 h-20 rounded-full eco-gradient flex items-center justify-center animate-bounce-in">
              <Star className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground">
            🎉 ¡Subiste de Nivel!
          </h2>
          
          <div className="space-y-2">
            <p className="text-4xl font-bold text-primary">
              Nivel {newLevel}
            </p>
            <p className="text-muted-foreground">
              ¡Sigue así, eres increíble! 🌟
            </p>
          </div>

          <Button onClick={handleClose} className="eco-gradient text-primary-foreground mt-4">
            ¡Genial!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}