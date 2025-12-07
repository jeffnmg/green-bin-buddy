import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Search, 
  Trophy, 
  Flame, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Leaf
} from "lucide-react";

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const TOUR_STEPS = [
  {
    id: 1,
    title: "📸 Sube una foto",
    description: "Toma una foto o sube una imagen de cualquier residuo que quieras clasificar. Funciona con plásticos, vidrio, metal, papel y más.",
    icon: Camera,
    color: "bg-blue-500",
    illustration: (
      <div className="relative w-48 h-48 mx-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-primary/20 rounded-2xl flex items-center justify-center">
          <div className="w-32 h-32 border-4 border-dashed border-primary/50 rounded-xl flex items-center justify-center bg-card/50">
            <Camera className="w-12 h-12 text-primary" />
          </div>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-bounce">
          <span className="text-sm">📷</span>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "🔍 Te decimos qué es",
    description: "Nuestra IA analiza tu imagen y te dice exactamente qué es, si es reciclable, y en qué contenedor debe ir.",
    icon: Search,
    color: "bg-emerald-500",
    illustration: (
      <div className="relative w-48 h-48 mx-auto">
        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl p-4">
          <div className="bg-card rounded-xl p-3 space-y-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥤</span>
              <span className="font-semibold text-sm text-foreground">Botella de plástico</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">♻️</span>
              <span className="text-xs text-muted-foreground">Reciclable → Caneca Blanca</span>
            </div>
            <div className="h-2 bg-success/30 rounded-full overflow-hidden">
              <div className="h-full w-[85%] bg-success rounded-full" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "🏆 Gana puntos y logros",
    description: "Cada escaneo te da 10 puntos. Acumula puntos para subir de nivel y desbloquea logros especiales.",
    icon: Trophy,
    color: "bg-amber-500",
    illustration: (
      <div className="relative w-48 h-48 mx-auto">
        <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-2">
            {["🌱", "🌿", "🏆", "⭐", "🔥", "👑"].map((emoji, i) => (
              <div 
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-2xl ${
                  i < 3 ? "bg-primary/20" : "bg-muted/50 opacity-50"
                }`}
              >
                {emoji}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xl font-bold text-primary">+10</span>
            <span className="text-sm text-muted-foreground">puntos</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "🔥 Mantén tu racha",
    description: "Escanea al menos un residuo cada día para mantener tu racha activa. ¡Las rachas largas dan logros especiales!",
    icon: Flame,
    color: "bg-orange-500",
    illustration: (
      <div className="relative w-48 h-48 mx-auto">
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-4">
          <div className="text-center">
            <div className="text-6xl mb-2">🔥</div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div 
                  key={day}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    day <= 5 
                      ? "bg-orange-500 text-white" 
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            <p className="text-sm font-semibold text-orange-500">5 días de racha</p>
          </div>
        </div>
      </div>
    ),
  },
];

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsOpen(false);
    onSkip();
  };

  const startTutorial = () => {
    setShowWelcome(false);
  };

  if (!isOpen) return null;

  // Welcome screen
  if (showWelcome) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md text-center border-primary/20 [&>button]:hidden">
          <div className="py-6 space-y-6">
            {/* Logo animation */}
            <div className="relative inline-flex items-center justify-center mx-auto">
              <div className="absolute animate-ping w-20 h-20 rounded-full bg-primary/20" />
              <div className="w-20 h-20 rounded-2xl eco-gradient flex items-center justify-center shadow-lg">
                <Leaf className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                ¡Bienvenido a Reciclaje IA! 🌍
              </h1>
              <p className="text-muted-foreground">
                Escanea residuos, gana puntos y protege el planeta
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <div className="text-3xl mb-1">📸</div>
                <p className="text-xs text-muted-foreground">Escanea</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">🏆</div>
                <p className="text-xs text-muted-foreground">Gana puntos</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">🌱</div>
                <p className="text-xs text-muted-foreground">Ayuda al planeta</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={startTutorial}
                className="w-full eco-gradient text-primary-foreground gap-2"
                size="lg"
              >
                <Sparkles className="w-5 h-5" />
                Comenzar tutorial
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                className="w-full text-muted-foreground"
              >
                Saltar tutorial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Tutorial steps
  const step = TOUR_STEPS[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md border-primary/20 [&>button]:hidden">
        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Paso {currentStep + 1} de {TOUR_STEPS.length}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSkip}
                className="text-muted-foreground h-auto py-1"
              >
                Saltar
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Illustration */}
          <div className="py-4">
            {step.illustration}
          </div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              {step.title}
            </h2>
            <p className="text-muted-foreground">
              {step.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex-1 gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 gap-2 eco-gradient text-primary-foreground"
            >
              {currentStep === TOUR_STEPS.length - 1 ? (
                <>
                  ¡Empezar! 
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2">
            {TOUR_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? "w-6 bg-primary" 
                    : index < currentStep 
                      ? "bg-primary/50" 
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}