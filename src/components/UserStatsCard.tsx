import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getLevelInfo, getLevelEmoji } from "@/lib/levelSystem";

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

  const levelInfo = getLevelInfo(profile.puntos);
  const levelEmoji = getLevelEmoji(levelInfo.tier);
  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <Card className="p-4 bg-card border-border card-shadow animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        {/* Level & Points */}
        <div className="flex items-center gap-3">
          <div 
            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${levelInfo.borderColor} ${levelInfo.bgColor}`}
          >
            <span className="text-xl">{levelEmoji}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span 
                className="text-sm font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: levelInfo.color, color: 'white' }}
              >
                Lvl {levelInfo.level}
              </span>
              <span className={`text-xs font-medium ${levelInfo.textColor}`}>
                {levelInfo.title}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${levelInfo.progressToNext}%`,
                    backgroundColor: levelInfo.color 
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {profile.puntos} pts
              </span>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2 bg-accent/50 rounded-full px-3 py-2">
          <Flame className="w-4 h-4 text-accent-foreground" />
          <span className="text-sm font-bold text-accent-foreground">
            {profile.racha_actual}
          </span>
          <span className="text-xs text-accent-foreground/70 hidden sm:inline">días</span>
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