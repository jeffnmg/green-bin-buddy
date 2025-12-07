import { useState, useEffect } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { ImagePreview } from "@/components/ImagePreview";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ResultCard } from "@/components/ResultCard";
import { ErrorMessage } from "@/components/ErrorMessage";
import Header from "@/components/Header";
import { UserStatsCard } from "@/components/UserStatsCard";
import { PointsAnimation } from "@/components/PointsAnimation";
import { LevelUpCelebration } from "@/components/LevelUpCelebration";
import { AchievementBadge } from "@/components/AchievementBadge";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useGamification } from "@/hooks/useGamification";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuth } from "@/contexts/AuthContext";
import { ChatWidget } from "@/components/ChatWidget";
import { Leaf } from "lucide-react";

interface ClassificationResult {
  tipo?: string;
  caneca?: string;
  categoria?: string;
  consejo?: string;
  confianza?: number;
  reciclable?: boolean;
  objeto_detectado?: string;
  objeto_detectado_espanol?: string;
  nivel_confianza?: "alta" | "media" | "baja";
  emoji_confianza?: string;
  sugerencia_foto?: string;
  dato_curioso?: string;
  impacto_ambiental?: string;
  ejemplos?: string[];
  puntos?: number;
}

interface Achievement {
  id: string;
  nombre: string;
  icono: string;
}

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Gamification state
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [displayedPoints, setDisplayedPoints] = useState(0);
  
  const { registerScan } = useGamification();
  const { profile } = useAuth();
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  // Sync displayed points with profile
  useEffect(() => {
    if (profile) {
      setDisplayedPoints(profile.puntos);
    }
  }, [profile?.puntos]);

  const handleImageSelect = async (file: File) => {
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
    setResult(null);
    setShowPointsAnimation(false);
    setNewAchievements([]);

    await classifyImage(file);
  };

  const classifyImage = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "https://reciclaje-api-64666058644.us-central1.run.app/clasificar/",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data: ClassificationResult = await response.json();
      setResult(data);

      // Register scan in gamification system
      const scanResult = await registerScan({
        objeto_detectado: data.objeto_detectado || data.tipo || 'objeto',
        objeto_detectado_espanol: data.objeto_detectado_espanol,
        tipo: data.tipo,
        caneca: data.caneca,
        reciclable: data.reciclable,
        confianza: data.confianza,
      });

      if (scanResult.success) {
        // Trigger points animation
        setEarnedPoints(scanResult.newPoints);
        setShowPointsAnimation(true);
        
        // Update displayed points with animation
        setDisplayedPoints(scanResult.totalPoints);
        
        // Check for level up
        if (scanResult.newLevel > scanResult.previousLevel) {
          setTimeout(() => {
            setNewLevel(scanResult.newLevel);
            setShowLevelUp(true);
          }, 800);
        }
        
        // Show new achievements
        if (scanResult.newAchievements.length > 0) {
          setNewAchievements(scanResult.newAchievements);
        }
      }
    } catch (err) {
      console.error("Error clasificando imagen:", err);
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos clasificar tu residuo. Por favor, intenta con otra imagen."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
    setShowPointsAnimation(false);
    setNewAchievements([]);
  };

  const handleRetry = () => {
    if (selectedImage) {
      classifyImage(selectedImage);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour 
          onComplete={completeOnboarding} 
          onSkip={skipOnboarding} 
        />
      )}

      {/* Header con usuario */}
      <Header />
      
      {/* Header decorativo */}
      <div className="absolute top-0 left-0 right-0 h-64 eco-gradient opacity-5 pointer-events-none" />

      <div className="container max-w-xl mx-auto py-8 md:py-12 px-4 relative">
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl eco-gradient shadow-eco mb-6 animate-pulse-soft">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            ♻️ Clasificador Inteligente de Residuos
          </h1>
          <p className="text-muted-foreground text-lg">
            Sube una foto y te diremos en qué contenedor va
          </p>
        </header>

        {/* User Stats Card - Before classification */}
        {!result && !isLoading && (
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <UserStatsCard />
          </div>
        )}

        {/* Contenido principal */}
        <section className="space-y-6 relative">
          {/* Points Animation */}
          <PointsAnimation points={earnedPoints} show={showPointsAnimation} />
          
          {/* Uploader o Preview */}
          {!imagePreview ? (
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <ImageUploader
                onImageSelect={handleImageSelect}
                disabled={isLoading}
              />
            </div>
          ) : (
            <ImagePreview
              imageUrl={imagePreview}
              onClear={handleReset}
              disabled={isLoading}
            />
          )}

          {/* Estados */}
          {isLoading && <LoadingSpinner />}

          {error && !isLoading && (
            <ErrorMessage message={error} onRetry={handleRetry} />
          )}

          {result && !isLoading && !error && (
            <>
              <ResultCard result={result} onReset={handleReset} />
              
              {/* New achievements badges */}
              {newAchievements.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-center text-muted-foreground mb-2">
                    ¡Logros desbloqueados!
                  </p>
                  <AchievementBadge achievements={newAchievements} />
                </div>
              )}
            </>
          )}
        </section>

        {/* Level Up Celebration Modal */}
        <LevelUpCelebration 
          show={showLevelUp} 
          newLevel={newLevel} 
          onClose={() => setShowLevelUp(false)} 
        />

        {/* Footer */}
        <footer
          className="text-center mt-12 text-sm text-muted-foreground animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <p>🌱 Juntos cuidamos el planeta</p>
        </footer>
      </div>

      {/* Chat Widget */}
      <ChatWidget />
    </main>
  );
};

export default Index;