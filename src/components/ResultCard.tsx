import { Recycle, Lightbulb, Camera, Tag, CheckCircle, XCircle, ChevronDown, List, Star, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  impacto?: string;
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

const getConfidenceColor = (nivel: string): { bar: string; text: string; bg: string } => {
  switch (nivel) {
    case "alta":
      return { bar: "bg-success", text: "text-success", bg: "bg-success/10" };
    case "media":
      return { bar: "bg-yellow-500", text: "text-yellow-600", bg: "bg-yellow-500/10" };
    case "baja":
      return { bar: "bg-destructive", text: "text-destructive", bg: "bg-destructive/10" };
    default:
      return { bar: "bg-muted", text: "text-muted-foreground", bg: "bg-muted/50" };
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
  const objetoDetectadoEspanol = result.objeto_detectado_espanol ?? objetoDetectado;
  const emojiConfianza = result.emoji_confianza ?? "📊";
  const nivelConfianza = result.nivel_confianza ?? "media";
  const sugerenciaFoto = result.sugerencia_foto;
  const datoCurioso = result.dato_curioso;
  const ejemplos = result.ejemplos ?? [];
  const puntos = result.puntos;
  const impacto = result.impacto;

  const emoji = extractEmoji(caneca);
  const confidenceColors = getConfidenceColor(nivelConfianza);
  const showRetakePhoto = sugerenciaFoto || nivelConfianza === "baja";

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* SECCIÓN 1 - DETECCIÓN */}
      <div className="bg-muted/50 rounded-2xl p-5 space-y-4">
        {/* Objeto detectado */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            🔍 Objeto detectado
          </p>
          <p className="text-2xl font-bold text-foreground">
            {objetoDetectadoEspanol}
          </p>
          {objetoDetectado && objetoDetectado !== objetoDetectadoEspanol && (
            <p className="text-sm text-muted-foreground">
              (detectado como: {objetoDetectado})
            </p>
          )}
        </div>

        {/* Barra de confianza */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xl">{emojiConfianza}</span>
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${confidenceColors.bar} rounded-full transition-all duration-700`}
                style={{ width: `${confianza}%` }}
              />
            </div>
            <span className={`text-lg font-bold ${confidenceColors.text}`}>
              {confianza}%
            </span>
          </div>
          <p className={`text-sm font-medium ${confidenceColors.text}`}>
            Confianza {nivelConfianza}
          </p>
        </div>

        {/* Sugerencia de foto */}
        {sugerenciaFoto && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {sugerenciaFoto}
            </p>
          </div>
        )}
      </div>

      {/* SECCIÓN 2 - CLASIFICACIÓN */}
      <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
        {/* Badge reciclable en esquina */}
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

        {/* Emoji grande de caneca */}
        <div className="text-center">
          <span className="text-[80px] leading-none block">{emoji}</span>
        </div>

        {/* Texto caneca */}
        <p className="text-center text-lg font-semibold text-foreground">
          {caneca}
        </p>

        {/* Tipo de residuo */}
        <h3 className="text-center text-2xl font-bold text-foreground">
          {tipo}
        </h3>

        {/* Badge categoría */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Tag className="w-4 h-4" />
            {categoria}
          </span>
        </div>

        {/* Consejo principal */}
        <div className="bg-accent/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <p className="text-foreground text-sm leading-relaxed">
              {consejo}
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3 - INFO ADICIONAL */}
      <div className="space-y-3">
        {/* Acordeón dato curioso */}
        {datoCurioso && (
          <Accordion type="single" collapsible className="bg-card rounded-xl shadow-sm">
            <AccordionItem value="dato-curioso" className="border-none">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="flex items-center gap-2 text-sm font-medium">
                  🧠 Dato curioso
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {datoCurioso}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Botones de modales */}
        <div className="flex flex-wrap gap-2 justify-center">
          {ejemplos.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <List className="w-4 h-4" />
                  Ejemplos
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

          {puntos !== undefined && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Star className="w-4 h-4" />
                  Puntos
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Puntos obtenidos</DialogTitle>
                </DialogHeader>
                <div className="text-center py-6">
                  <span className="text-5xl font-bold text-primary">+{puntos}</span>
                  <p className="text-muted-foreground mt-2">puntos por reciclar correctamente</p>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {impacto && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Leaf className="w-4 h-4" />
                  Impacto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Impacto ambiental</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {impacto}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Botón principal */}
        <Button
          variant={showRetakePhoto ? "eco" : "eco-outline"}
          size="lg"
          className={`w-full ${nivelConfianza === "baja" ? "animate-pulse" : ""}`}
          onClick={onReset}
        >
          {showRetakePhoto ? (
            <>
              <Camera className="w-5 h-5" />
              Tomar otra foto
            </>
          ) : (
            <>
              <Recycle className="w-5 h-5" />
              Clasificar otro residuo
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
