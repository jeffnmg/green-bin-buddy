import { Recycle, Lightbulb, Target, Trash2, Tag, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClassificationResult {
  tipo?: string;
  caneca?: string;
  categoria?: string;
  consejo?: string;
  confianza?: number;
  reciclable?: boolean;
}

interface ResultCardProps {
  result: ClassificationResult;
  onReset: () => void;
}

const extractEmoji = (caneca: string): string => {
  const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  const match = caneca.match(emojiRegex);
  return match ? match[0] : "♻️";
};

const getConfidenceColor = (confianza: number): string => {
  if (confianza >= 80) return "text-success";
  if (confianza >= 60) return "text-primary";
  return "text-muted-foreground";
};

export const ResultCard = ({ result, onReset }: ResultCardProps) => {
  const tipo = result.tipo ?? "Residuo no identificado";
  const caneca = result.caneca ?? "♻️ Contenedor";
  const categoria = result.categoria ?? "Sin categoría";
  const consejo = result.consejo ?? "Sin consejo disponible";
  const confianza = result.confianza ?? 0;
  const reciclable = result.reciclable ?? false;

  const emoji = extractEmoji(caneca);
  const confidenceColor = getConfidenceColor(confianza);

  return (
    <div className="bg-card rounded-2xl shadow-card p-6 md:p-8 space-y-6 animate-fade-in-up">
      {/* Emoji y título principal */}
      <div className="text-center space-y-3">
        <span className="text-6xl md:text-7xl block mb-4">{emoji}</span>
        <h3 className="text-2xl md:text-3xl font-bold text-foreground">
          {tipo}
        </h3>
        
        {/* Badge reciclable */}
        <div className="flex justify-center">
          {reciclable ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Reciclable
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
              <XCircle className="w-4 h-4" />
              No reciclable
            </span>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4">
        {/* Caneca */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-accent/50">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Caneca
            </p>
            <p className="text-lg font-semibold text-foreground mt-1">
              {caneca}
            </p>
          </div>
        </div>

        {/* Categoría */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-accent/50">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Categoría
            </p>
            <p className="text-lg font-semibold text-foreground mt-1">
              {categoria}
            </p>
          </div>
        </div>

        {/* Consejo */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-accent/50">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Consejo
            </p>
            <p className="text-base text-foreground mt-1">
              {consejo}
            </p>
          </div>
        </div>

        {/* Confianza */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/50">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Nivel de Confianza
            </p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full eco-gradient rounded-full transition-all duration-700"
                  style={{ width: `${confianza}%` }}
                />
              </div>
              <span className={`text-lg font-bold ${confidenceColor}`}>
                {confianza}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón reset */}
      <Button
        variant="eco-outline"
        size="lg"
        className="w-full"
        onClick={onReset}
      >
        <Recycle className="w-5 h-5" />
        Clasificar otro residuo
      </Button>
    </div>
  );
};
