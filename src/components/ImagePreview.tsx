import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  imageUrl: string;
  onClear: () => void;
  disabled?: boolean;
}

export const ImagePreview = ({ imageUrl, onClear, disabled }: ImagePreviewProps) => {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-card animate-scale-in">
      <img
        src={imageUrl}
        alt="Preview del residuo"
        className="w-full max-h-80 object-contain bg-muted/50"
      />
      {!disabled && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-3 right-3 rounded-full shadow-lg"
          onClick={onClear}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
