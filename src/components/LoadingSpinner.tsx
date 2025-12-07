import { Loader2 } from "lucide-react";

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 rounded-full eco-gradient animate-spin-slow flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-foreground animate-pulse" />
        </div>
        <div className="absolute inset-0 w-16 h-16 rounded-full eco-gradient opacity-30 animate-ping" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">Analizando...</p>
        <p className="text-sm text-muted-foreground animate-pulse-soft">
          Identificando el tipo de residuo ♻️
        </p>
      </div>
    </div>
  );
};
