import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareResultProps {
  objeto: string;
  reciclable?: boolean;
}

export function ShareResult({ objeto, reciclable }: ShareResultProps) {
  const shareText = reciclable 
    ? `🌍♻️ Acabo de reciclar correctamente un/una ${objeto} con el Clasificador Inteligente de Residuos. ¡Cuidemos el planeta juntos!`
    : `🌍 Acabo de clasificar un/una ${objeto} correctamente con el Clasificador Inteligente de Residuos. ¡Cada acción cuenta!`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Clasificador de Residuos",
          text: shareText,
          url: window.location.href,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    toast.success("¡Copiado al portapapeles! 📋", {
      description: "Ahora puedes pegarlo en tus redes sociales",
    });
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleShare}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Share2 className="w-4 h-4" />
      Compartir
    </Button>
  );
}