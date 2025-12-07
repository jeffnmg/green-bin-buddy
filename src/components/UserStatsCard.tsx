import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Trophy, Flame, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const motivationalMessages = [
  "¡Vas por buen camino! 🌱",
  "¡Cada escaneo cuenta! 🌍",
  "¡Eres un héroe del reciclaje! 💚",
  "¡Sigue así, campeón! 🏆",
  "¡El planeta te lo agradece! 🌎",
];

export function UserStatsCard() {
  const { profile } = useAuth();

  if (!profile) return null;

  const level = Math.floor(profile.puntos / 100);
  const progressToNextLevel = profile.puntos % 100;
  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <Card className="p-4 bg-card border-border card-shadow animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        {/* Points */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full eco-gradient flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Puntos</p>
            <p className="text-lg font-bold text-foreground">{profile.puntos}</p>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
            <Flame className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Racha</p>
            <p className="text-lg font-bold text-foreground">🔥 {profile.racha_actual} días</p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Target className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nivel {level}</p>
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full eco-gradient transition-all duration-500"
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Motivational message */}
      <p className="mt-3 text-sm text-center text-muted-foreground font-medium">
        {randomMessage}
      </p>

      {/* View Progress Button */}
      <div className="mt-3 flex justify-center">
        <Button variant="outline" size="sm" asChild className="text-primary hover:text-primary">
          <Link to="/profile">
            📊 Ver mi progreso
          </Link>
        </Button>
      </div>
    </Card>
  );
}