import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, ChartBar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getLevelInfo, getLevelEmoji } from '@/lib/levelSystem';

export default function Header() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesión cerrada');
  };

  if (!profile) return null;

  const levelInfo = getLevelInfo(profile.puntos);
  const levelEmoji = getLevelEmoji(levelInfo.tier);

  return (
    <header className="w-full bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="font-semibold text-foreground hidden sm:inline">EcoScan</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Stats badges - Desktop */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full">
              🔥 {profile.racha_actual}
            </span>
          </div>
          
          {/* User menu with level display */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
                {/* Avatar with level border */}
                <div className="relative">
                  <div 
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${levelInfo.borderColor} ${levelInfo.bgColor}`}
                  >
                    <User className={`w-4 h-4 ${levelInfo.textColor}`} />
                  </div>
                  {/* Level badge */}
                  <div 
                    className={`absolute -bottom-1 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-background px-1`}
                    style={{ backgroundColor: levelInfo.color, color: 'white' }}
                  >
                    {levelInfo.level}
                  </div>
                </div>
                
                {/* Username and progress */}
                <div className="hidden sm:flex flex-col items-start">
                  <span className="font-medium text-sm leading-tight">{profile.username}</span>
                  {/* Mini progress bar */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${levelInfo.progressToNext}%`,
                          backgroundColor: levelInfo.color 
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {profile.puntos} pts
                    </span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  {/* Avatar in dropdown */}
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${levelInfo.borderColor} ${levelInfo.bgColor}`}
                  >
                    <span className="text-2xl">{levelEmoji}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{profile.username}</span>
                    <span className={`text-xs font-medium ${levelInfo.textColor}`}>
                      {levelEmoji} {levelInfo.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{profile.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              {/* Level progress section */}
              <div className="px-2 py-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium" style={{ color: levelInfo.color }}>
                    Nivel {levelInfo.level}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {profile.puntos} / {levelInfo.pointsForNextLevel} pts
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${levelInfo.progressToNext}%`,
                      backgroundColor: levelInfo.color 
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {100 - levelInfo.progressToNext} puntos para nivel {levelInfo.level + 1}
                </p>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <ChartBar className="w-4 h-4 mr-2" />
                Ver mi perfil
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="flex justify-between">
                <span>Objetos escaneados</span>
                <span className="font-medium">{profile.objetos_escaneados}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex justify-between">
                <span>Racha actual</span>
                <span className="font-medium">🔥 {profile.racha_actual}</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}