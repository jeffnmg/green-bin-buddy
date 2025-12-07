import { Camera, Tag, CheckCircle, XCircle, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ClassificationResult {
  tipo?: string;
  caneca?: string;
  categoria?: string;
  consejo?: string;
  confianza?: number;
  reciclable?: boolean;
  objeto_detectado?: string;
  objeto_detectado_espanol?: string;
  emoji_confianza?: string;
  nivel_confianza?: "alta" | "media" | "baja";
  sugerencia_foto?: string;
  dato_curioso?: string;
  ejemplos?: string[];
  puntos?: number;
  impacto_ambiental?: string;
}

interface ResultCardProps {
  result: ClassificationResult;
  onReset: () => void;
}

const extractEmoji = (caneca?: string): string => {
  if (!caneca || typeof caneca !== "string") {
    return "♻️";
  }
  const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  const match = caneca.match(emojiRegex);
  return match ? match[0] : "♻️";
};

const getConfidenceStyles = (nivel: string) => {
  switch (nivel) {
    case "alta":
      return {
        barColor: "bg-success",
        textColor: "text-success",
        label: "Alta precisión",
      };
    case "media":
      return {
        barColor: "bg-yellow-500",
        textColor: "text-yellow-600",
        label: "Precisión media",
      };
    case "baja":
      return {
        barColor: "bg-destructive",
        textColor: "text-destructive",
        label: "⚠️ Confianza baja",
      };
    default:
      return {
        barColor: "bg-muted",
        textColor: "text-muted-foreground",
        label: "Sin datos",
      };
  }
};

export const ResultCard = ({ result, onReset }: ResultCardProps) => {
  const tipo = result.tipo ?? "Residuo no identificado";
  const caneca = result.caneca ?? "♻️ Contenedor";
  const categoria = result.categoria ?? "Sin categoría";
  const consejo = result.consejo ?? "Sin consejo disponible";
  const confianza = result.confianza ?? 0;
  const reciclable = result.reciclable ?? false;
  const objetoDetectado = result.objeto_detectado ?? "";
  const objetoDetectadoEspanol = result.objeto_detectado_espanol || objetoDetectado || "Objeto";
  const emojiConfianza = result.emoji_confianza ?? "📊";
  const nivelConfianza = result.nivel_confianza ?? "media";
  const sugerenciaFoto = result.sugerencia_foto;
  const datoCurioso = result.dato_curioso;
  const ejemplos = result.ejemplos ?? [];
  const impacto = result.impacto_ambiental;

  const emoji = extractEmoji(caneca);
  const confidenceStyles = getConfidenceStyles(nivelConfianza);
  const isLowConfidence = nivelConfianza === "baja";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* SECCIÓN 1 - DETECCIÓN */}
      <div className="bg-background rounded-2xl border-2 border-primary/20 p-5 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">🔍 Detectamos:</p>
        <p className="text-xl font-bold text-foreground">{objetoDetectadoEspanol}</p>
        {objetoDetectado && objetoDetectado !== objetoDetectadoEspanol && (
          <p className="text-sm text-muted-foreground">({objetoDetectado})</p>
        )}
      </div>

      {/* SECCIÓN 2 - CLASIFICACIÓN PRINCIPAL */}
      <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
        {/* Badge reciclable */}
        <div className="flex justify-end">
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

        {/* Emoji caneca 80px */}
        <div className="text-center">
          <span className="text-[80px] leading-none block">{emoji}</span>
        </div>

        {/* Texto caneca */}
        <p className="text-center text-lg font-semibold text-foreground">{caneca}</p>

        {/* Tipo de residuo */}
        <h3 className="text-center text-2xl font-bold text-foreground">{tipo}</h3>

        {/* Badge categoría */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Tag className="w-4 h-4" />
            {categoria}
          </span>
        </div>
      </div>

      {/* SECCIÓN 3 - INFORMACIÓN ÚTIL */}
      <div className="space-y-3">
        {/* Consejo principal */}
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">💬</span>
            <p className="text-foreground text-sm leading-relaxed">{consejo}</p>
          </div>
        </div>

        {/* Impacto ambiental - SIEMPRE VISIBLE */}
        {impacto && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">🌍 Impacto ambiental</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">{impacto}</p>
          </div>
        )}
      </div>

      {/* SECCIÓN 4 - INFORMACIÓN ADICIONAL */}
      <div className="space-y-3">
        {/* Acordeón dato curioso */}
        {datoCurioso && (
          <Accordion type="single" collapsible className="bg-card rounded-xl shadow-sm">
            <AccordionItem value="dato-curioso" className="border-none">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="flex items-center gap-2 text-sm font-medium">💡 Dato curioso</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{datoCurioso}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Botones modales */}
        <div className="flex flex-wrap gap-2 justify-center">
          {ejemplos.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Package className="w-4 h-4" />
                  📦 Ver ejemplos similares
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ejemplos de {tipo}</DialogTitle>
                </DialogHeader>
                <ul className="space-y-2 mt-4">
                  {ejemplos.map((ejemplo, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {ejemplo}
                    </li>
                  ))}
                </ul>
              </DialogContent>
            </Dialog>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <MapPin className="w-4 h-4" />
                📍 ¿Dónde reciclarlo?
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Dónde reciclarlo?</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Deposita este residuo en la <strong>{caneca}</strong>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Busca puntos de reciclaje cercanos en tu comunidad o consulta con tu municipio.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SECCIÓN 5 - CONFIANZA Y ACCIÓN */}
      <div className="space-y-4">
        {/* Separador */}
        <div className="border-t border-border" />

        {/* Tarjeta de confianza */}
        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">{emojiConfianza}</span>
            <span className="text-sm font-medium text-foreground">Confianza: {confianza}%</span>
          </div>

          {/* Barra de progreso */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${confidenceStyles.barColor} rounded-full transition-all duration-700`}
              style={{ width: `${confianza}%` }}
            />
          </div>

          <p className={`text-xs font-medium ${confidenceStyles.textColor}`}>{confidenceStyles.label}</p>

          {/* Card de sugerencia para confianza baja */}
          {isLowConfidence && sugerenciaFoto && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 flex items-start gap-2">
              <span className="text-sm flex-shrink-0">📸</span>
              <p className="text-xs text-yellow-800 dark:text-yellow-200">{sugerenciaFoto}</p>
            </div>
          )}
        </div>

        {/* Botón principal */}
        <Button
          variant={isLowConfidence ? "eco" : "outline"}
          size="lg"
          className={`w-full gap-2 ${isLowConfidence ? "shadow-lg" : ""}`}
          onClick={onReset}
        >
          <Camera className="w-5 h-5" />
          {isLowConfidence ? "📸 Tomar otra foto" : "📸 Clasificar otro residuo"}
        </Button>
      </div>
    </div>
  );
};
