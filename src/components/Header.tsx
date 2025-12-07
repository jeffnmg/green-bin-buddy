import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Trophy, ChartBar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function Header() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesión cerrada');
  };

  if (!profile) return null;

  return (
    <header className="w-full bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♻️</span>
          <span className="font-semibold text-foreground hidden sm:inline">EcoScan</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Stats badges */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full">
              <Trophy className="w-3 h-3" />
              {profile.puntos} pts
            </span>
            <span className="flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-full">
              🔥 {profile.racha_actual}
            </span>
          </div>
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="hidden sm:inline font-medium">{profile.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{profile.username}</span>
                  <span className="text-xs text-muted-foreground">{profile.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <ChartBar className="w-4 h-4 mr-2" />
                Ver mi perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex justify-between">
                <span>Puntos</span>
                <span className="font-medium text-primary">{profile.puntos}</span>
              </DropdownMenuItem>
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
