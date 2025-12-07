import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface Achievement {
  id: string;
  nombre: string;
  icono: string;
}

interface AchievementBadgeProps {
  achievements: Achievement[];
}

export function AchievementBadge({ achievements }: AchievementBadgeProps) {
  if (achievements.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center animate-bounce-in">
      {achievements.map((achievement) => (
        <Link key={achievement.id} to="/profile">
          <Badge 
            variant="secondary" 
            className="bg-accent text-accent-foreground hover:bg-accent/80 cursor-pointer px-3 py-1.5 text-sm"
          >
            {achievement.icono} {achievement.nombre}
          </Badge>
        </Link>
      ))}
      <Link to="/profile">
        <Badge variant="outline" className="text-primary border-primary hover:bg-primary/10 cursor-pointer">
          Ver todos →
        </Badge>
      </Link>
    </div>
  );
}