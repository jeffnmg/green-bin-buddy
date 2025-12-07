import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

export const ErrorMessage = ({ message, onRetry }: ErrorMessageProps) => {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
      <div className="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
        <AlertCircle className="w-7 h-7 text-destructive" />
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold text-foreground">
          ¡Ups! Algo salió mal
        </h4>
        <p className="text-sm text-muted-foreground">
          {message}
        </p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" />
        Intentar de nuevo
      </Button>
    </div>
  );
};
