import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Star, Trophy, Package, Flame, Calendar, Lock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface UserStats {
  id: string;
  puntos: number;
  objetos_escaneados: number;
  racha_actual: number;
  racha_maxima: number;
}

interface Achievement {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: "puntos" | "escaneos" | "racha";
  umbral: number;
  icono: string;
  unlocked: boolean;
  unlocked_at?: string;
}

interface Scan {
  id: string;
  objeto_detectado_espanol?: string;
  objeto_detectado: string;
  created_at: string;
}

type FilterStatus = "all" | "unlocked" | "locked";
type FilterType = "all" | "puntos" | "escaneos" | "racha";

export default function Achievements() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch user stats
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, puntos, objetos_escaneados, racha_actual, racha_maxima")
        .eq("auth_user_id", user.id)
        .single();

      if (userError) throw userError;
      setStats(userData);

      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .eq("activo", true)
        .order("umbral", { ascending: true });

      if (achievementsError) throw achievementsError;

      // Fetch user's unlocked achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", userData.id);

      if (userAchievementsError) throw userAchievementsError;

      const unlockedMap = new Map(
        (userAchievements || []).map((ua) => [ua.achievement_id, ua.unlocked_at])
      );

      const achievementsWithStatus: Achievement[] = (allAchievements || []).map((a) => ({
        ...a,
        unlocked: unlockedMap.has(a.id),
        unlocked_at: unlockedMap.get(a.id),
      }));

      setAchievements(achievementsWithStatus);

      // Fetch scans for context
      const { data: scansData } = await supabase
        .from("scans")
        .select("id, objeto_detectado_espanol, objeto_detectado, created_at")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false });

      setScans(scansData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error cargando logros");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentValue = (tipo: string): number => {
    if (!stats) return 0;
    switch (tipo) {
      case "puntos": return stats.puntos;
      case "escaneos": return stats.objetos_escaneados;
      case "racha": return Math.max(stats.racha_actual, stats.racha_maxima);
      default: return 0;
    }
  };

  const getProgressPercent = (achievement: Achievement): number => {
    const current = getCurrentValue(achievement.tipo);
    return Math.min((current / achievement.umbral) * 100, 100);
  };

  const getRemainingText = (achievement: Achievement): string => {
    const current = getCurrentValue(achievement.tipo);
    const remaining = achievement.umbral - current;
    
    if (remaining <= 0) return "¡Ya lo cumples!";
    
    switch (achievement.tipo) {
      case "puntos": return `Te faltan ${remaining} puntos`;
      case "escaneos": return `Te faltan ${remaining} escaneos`;
      case "racha": return `Te faltan ${remaining} días de racha`;
      default: return "";
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "puntos": return <Trophy className="w-4 h-4" />;
      case "escaneos": return <Package className="w-4 h-4" />;
      case "racha": return <Flame className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case "puntos": return "Puntos";
      case "escaneos": return "Escaneos";
      case "racha": return "Racha";
      default: return tipo;
    }
  };

  const findTriggeringScan = (achievement: Achievement): Scan | null => {
    if (!achievement.unlocked_at || !scans.length) return null;
    
    const unlockDate = new Date(achievement.unlocked_at);
    
    // Find the scan closest to the unlock time (within a minute)
    const triggeringScan = scans.find((scan) => {
      const scanDate = new Date(scan.created_at);
      const diff = Math.abs(unlockDate.getTime() - scanDate.getTime());
      return diff < 60000; // Within 1 minute
    });
    
    return triggeringScan || null;
  };

  const handleAchievementClick = (achievement: Achievement) => {
    if (achievement.unlocked) {
      setSelectedAchievement(achievement);
      setDialogOpen(true);
    }
  };

  const filteredAchievements = achievements.filter((a) => {
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "unlocked" && a.unlocked) ||
      (filterStatus === "locked" && !a.unlocked);
    
    const matchesType = 
      filterType === "all" || 
      a.tipo === filterType;
    
    return matchesStatus && matchesType;
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Mis Logros
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Card */}
        <Card className="bg-gradient-to-br from-primary/10 via-card to-amber-500/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Tu progreso</h2>
                <p className="text-muted-foreground text-sm">
                  Has desbloqueado {unlockedCount} de {totalCount} logros ({Math.round(progressPercent)}%)
                </p>
              </div>
              <div className="text-4xl font-bold text-primary">
                {unlockedCount}/{totalCount}
              </div>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los logros</SelectItem>
              <SelectItem value="unlocked">✅ Desbloqueados</SelectItem>
              <SelectItem value="locked">🔒 Bloqueados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="puntos">🏆 Puntos</SelectItem>
              <SelectItem value="escaneos">📦 Escaneos</SelectItem>
              <SelectItem value="racha">🔥 Racha</SelectItem>
            </SelectContent>
          </Select>

          {(filterStatus !== "all" || filterType !== "all") && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setFilterStatus("all");
                setFilterType("all");
              }}
              className="text-muted-foreground"
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Achievements Grid */}
        {filteredAchievements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Star className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay logros que coincidan con los filtros</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                onClick={() => handleAchievementClick(achievement)}
                className={`relative overflow-hidden transition-all ${
                  achievement.unlocked
                    ? "bg-gradient-to-br from-primary/10 via-card to-emerald-500/10 border-primary/30 cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                    : "bg-muted/30 border-border"
                }`}
              >
                <CardContent className="pt-5 pb-4">
                  {/* Lock icon for locked achievements */}
                  {!achievement.unlocked && (
                    <div className="absolute top-3 right-3">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`text-5xl ${
                        achievement.unlocked ? "" : "grayscale opacity-50"
                      }`}
                    >
                      {achievement.icono}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <h3
                        className={`font-semibold ${
                          achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {achievement.nombre}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {achievement.descripcion}
                      </p>

                      {/* Type badge */}
                      <Badge
                        variant={achievement.unlocked ? "secondary" : "outline"}
                        className="mt-2 gap-1"
                      >
                        {getTypeIcon(achievement.tipo)}
                        {getTypeLabel(achievement.tipo)}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress for locked achievements */}
                  {!achievement.unlocked && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {getCurrentValue(achievement.tipo)} / {achievement.umbral}
                        </span>
                        <span className="text-muted-foreground">
                          {Math.round(getProgressPercent(achievement))}%
                        </span>
                      </div>
                      <Progress value={getProgressPercent(achievement)} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {getRemainingText(achievement)}
                      </p>
                    </div>
                  )}

                  {/* Unlock date for unlocked achievements */}
                  {achievement.unlocked && achievement.unlocked_at && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-primary">
                      <Calendar className="w-3.5 h-3.5" />
                      Desbloqueado {format(new Date(achievement.unlocked_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Achievement Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedAchievement && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-4xl">{selectedAchievement.icono}</span>
                  {selectedAchievement.nombre}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {selectedAchievement.descripcion}
                </p>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="gap-1">
                      {getTypeIcon(selectedAchievement.tipo)}
                      {getTypeLabel(selectedAchievement.tipo)}
                    </Badge>
                    <span className="text-muted-foreground">
                      Meta: {selectedAchievement.umbral}
                    </span>
                  </div>

                  {selectedAchievement.unlocked_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-foreground">
                        Desbloqueado el{" "}
                        {format(
                          new Date(selectedAchievement.unlocked_at),
                          "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm",
                          { locale: es }
                        )}
                      </span>
                    </div>
                  )}

                  {(() => {
                    const triggeringScan = findTriggeringScan(selectedAchievement);
                    if (triggeringScan) {
                      return (
                        <div className="flex items-center gap-2 text-sm bg-primary/10 rounded-lg p-3">
                          <Package className="w-4 h-4 text-primary" />
                          <span className="text-foreground">
                            Desbloqueado al escanear:{" "}
                            <strong>
                              {triggeringScan.objeto_detectado_espanol || triggeringScan.objeto_detectado}
                            </strong>
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="text-center pt-2">
                  <p className="text-2xl">🎉</p>
                  <p className="text-sm text-muted-foreground">¡Felicidades por este logro!</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}