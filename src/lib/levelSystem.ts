export interface LevelInfo {
  level: number;
  title: string;
  tier: 'novato' | 'intermedio' | 'avanzado' | 'maestro';
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  progressToNext: number;
  pointsForCurrentLevel: number;
  pointsForNextLevel: number;
}

export function getLevelInfo(puntos: number): LevelInfo {
  const level = Math.floor(puntos / 100) + 1; // Start at level 1
  const pointsInCurrentLevel = puntos % 100;
  const progressToNext = pointsInCurrentLevel;
  
  let tier: LevelInfo['tier'];
  let title: string;
  let color: string;
  let borderColor: string;
  let bgColor: string;
  let textColor: string;

  if (level <= 5) {
    tier = 'novato';
    title = 'Reciclador Novato';
    color = 'hsl(142, 76%, 50%)'; // Light green
    borderColor = 'border-green-400';
    bgColor = 'bg-green-400/20';
    textColor = 'text-green-500';
  } else if (level <= 10) {
    tier = 'intermedio';
    title = 'Eco-Guerrero';
    color = 'hsl(158, 64%, 35%)'; // Dark green
    borderColor = 'border-green-600';
    bgColor = 'bg-green-600/20';
    textColor = 'text-green-600';
  } else if (level <= 20) {
    tier = 'avanzado';
    title = 'Guardián Verde';
    color = 'hsl(45, 93%, 47%)'; // Gold
    borderColor = 'border-yellow-500';
    bgColor = 'bg-yellow-500/20';
    textColor = 'text-yellow-500';
  } else {
    tier = 'maestro';
    title = 'Maestro del Reciclaje';
    color = 'hsl(220, 13%, 70%)'; // Platinum
    borderColor = 'border-slate-400';
    bgColor = 'bg-slate-400/20';
    textColor = 'text-slate-400';
  }

  return {
    level,
    title,
    tier,
    color,
    borderColor,
    bgColor,
    textColor,
    progressToNext,
    pointsForCurrentLevel: (level - 1) * 100,
    pointsForNextLevel: level * 100,
  };
}

export function getLevelEmoji(tier: LevelInfo['tier']): string {
  switch (tier) {
    case 'novato':
      return '🌱';
    case 'intermedio':
      return '🌿';
    case 'avanzado':
      return '🏆';
    case 'maestro':
      return '👑';
  }
}