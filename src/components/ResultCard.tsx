import { Recycle, Lightbulb, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClassificationResult {
  tipo_residuo: string;
  contenedor: string;
  consejo: string;
  confianza: number;
}

interface ResultCardProps {
  result: ClassificationResult;
  onReset: () => void;
}

const getContainerEmoji = (contenedor: string): string => {
  const lower = contenedor.toLowerCase();
  if (lower.includes("amarillo") || lower.includes("plástico") || lower.includes("envases")) return "🟡";
  if (lower.includes("azul") || lower.includes("papel") || lower.includes("cartón")) return "🔵";
  if (lower.includes("verde") || lower.includes("vidrio")) return "🟢";
  if (lower.includes("marrón") || lower.includes("orgánico") || lower.includes("compost")) return "🟤";
  if (lower.includes("gris") || lower.includes("resto") || lower.includes("general")) return "⚫";
  if (lower.includes("rojo") || lower.includes("peligroso") || lower.includes("especial")) return "🔴";
  return "♻️";
};

const getConfidenceColor = (confianza: number): string => {
  if (confianza >= 80) return "text-success";
  if (confianza >= 60) return "text-primary";
  return "text-muted-foreground";
};

export const ResultCard = ({ result, onReset }: ResultCardProps) => {
  const emoji = getContainerEmoji(result.contenedor);
  const confidenceColor = getConfidenceColor(result.confianza);

  return (
    <div className="bg-card rounded-2xl shadow-card p-6 md:p-8 space-y-6 animate-fade-in-up">
      {/* Contenedor principal */}
      <div className="text-center space-y-2">
        <span className="text-6xl md:text-7xl block mb-4">{emoji}</span>
        <h3 className="text-2xl md:text-3xl font-bold text-foreground">
          {result.contenedor}
        </h3>
      </div>

      {/* Info cards */}
      <div className="grid gap-4">
        {/* Tipo de residuo */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-accent/50">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tipo de Residuo
            </p>
            <p className="text-lg font-semibold text-foreground mt-1">
              {result.tipo_residuo}
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
              {result.consejo}
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
                  style={{ width: `${result.confianza}%` }}
                />
              </div>
              <span className={`text-lg font-bold ${confidenceColor}`}>
                {result.confianza}%
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
