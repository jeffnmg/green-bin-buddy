import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

export const ImageUploader = ({ onImageSelect, disabled }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
          onImageSelect(file);
        }
      }
    },
    [onImageSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-dashed p-8 md:p-12 transition-all duration-300 cursor-pointer",
        "bg-card/50 backdrop-blur-sm",
        isDragging
          ? "border-primary bg-accent/50 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-accent/30",
        disabled && "opacity-50 pointer-events-none"
      )}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        capture="environment"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-6 text-center">
        <div
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
            isDragging ? "eco-gradient scale-110" : "bg-accent"
          )}
        >
          {isDragging ? (
            <ImageIcon className="w-10 h-10 text-primary-foreground" />
          ) : (
            <Upload className="w-10 h-10 text-primary" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-lg md:text-xl font-semibold text-foreground">
            📸 Subir Foto del Residuo
          </p>
          <p className="text-sm text-muted-foreground">
            Arrastra una imagen aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-muted-foreground">
            Formatos: JPG, PNG
          </p>
        </div>

        <Button variant="eco" size="lg" className="mt-2" disabled={disabled}>
          <Upload className="w-5 h-5" />
          Seleccionar Imagen
        </Button>
      </div>
    </div>
  );
};
