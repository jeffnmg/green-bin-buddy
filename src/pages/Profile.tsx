import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Trophy,
  Package,
  Flame,
  Star,
  LogOut,
  BarChart3,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { getLevelInfo, getLevelEmoji } from "@/lib/levelSystem";
import { ScanHistory } from "@/components/ScanHistory";
import { StatisticsTab } from "@/components/StatisticsTab";

interface UserStats {
  id: string;
  username: string;
  email: string;
  puntos: number;
  objetos_escaneados: number;
  racha_actual: number;
  racha_maxima: number;
}

interface Achievement {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  umbral: number;
  icono: string;
  unlocked: boolean;
  unlocked_at?: string;
}

interface Scan {
  id: string;
  objeto_detectado: string;
  objeto_detectado_espanol?: string;
  tipo_residuo?: string;
  caneca?: string;
  reciclable: boolean;
  puntos_ganados: number;
  origen: string;
  created_at: string;
  confianza?: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user stats
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
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
      const { data: userAchievements, error: userAchievementsError } =
        await supabase
          .from("user_achievements")
          .select("achievement_id, unlocked_at")
          .eq("user_id", userData.id);

      if (userAchievementsError) throw userAchievementsError;

      const unlockedMap = new Map(
        (userAchievements || []).map((ua) => [ua.achievement_id, ua.unlocked_at])
      );

      const achievementsWithStatus: Achievement[] = (allAchievements || []).map(
        (a) => ({
          ...a,
          unlocked: unlockedMap.has(a.id),
          unlocked_at: unlockedMap.get(a.id),
        })
      );

      setAchievements(achievementsWithStatus);

      // Fetch recent scans
      const { data: scansData, error: scansError } = await supabase
        .from("scans")
        .select("*")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (scansError) throw scansError;
      setScans(scansData || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Error cargando datos del perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada");
    navigate("/auth");
  };
  const getProgressForAchievement = (achievement: Achievement): number => {
    if (!stats) return 0;
    let current = 0;
    switch (achievement.tipo) {
      case "puntos":
        current = stats.puntos;
        break;
      case "escaneos":
        current = stats.objetos_escaneados;
        break;
      case "racha":
        current = Math.max(stats.racha_actual, stats.racha_maxima);
        break;
    }
    return Math.min((current / achievement.umbral) * 100, 100);
  };

  const getProgressText = (achievement: Achievement): string => {
    if (!stats) return "";
    let current = 0;
    switch (achievement.tipo) {
      case "puntos":
        current = stats.puntos;
        break;
      case "escaneos":
        current = stats.objetos_escaneados;
        break;
      case "racha":
        current = Math.max(stats.racha_actual, stats.racha_maxima);
        break;
    }
    return `${current}/${achievement.umbral}`;
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No se encontró el perfil</p>
      </div>
    );
  }

  const levelInfo = getLevelInfo(stats.puntos);
  const levelEmoji = getLevelEmoji(levelInfo.tier);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="font-semibold">Mi Perfil</h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar with level border */}
              <div 
                className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl border-4 ${levelInfo.borderColor} ${levelInfo.bgColor}`}
              >
                {levelEmoji}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-foreground">
                  {stats.username}
                </h2>
                <p className={`font-medium ${levelInfo.textColor}`}>
                  {levelEmoji} {levelInfo.title}
                </p>
                <p className="text-muted-foreground text-sm">{stats.email}</p>
                <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                  <Badge 
                    className="text-sm text-white"
                    style={{ backgroundColor: levelInfo.color }}
                  >
                    Nivel {levelInfo.level}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {levelInfo.progressToNext}/100 para nivel {levelInfo.level + 1}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${levelInfo.progressToNext}%`,
                    backgroundColor: levelInfo.color 
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center sm:text-left">
                {100 - levelInfo.progressToNext} puntos para el siguiente nivel
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-amber-500/10 to-card border-amber-500/20">
            <CardContent className="pt-4 text-center">
              <Trophy className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.puntos}</p>
              <p className="text-xs text-muted-foreground">Puntos totales</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-card border-blue-500/20">
            <CardContent className="pt-4 text-center">
              <Package className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {stats.objetos_escaneados}
              </p>
              <p className="text-xs text-muted-foreground">Objetos escaneados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-card border-orange-500/20">
            <CardContent className="pt-4 text-center">
              <Flame className="w-8 h-8 mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {stats.racha_actual}
              </p>
              <p className="text-xs text-muted-foreground">Racha actual</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-card border-purple-500/20">
            <CardContent className="pt-4 text-center">
              <Star className="w-8 h-8 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {unlockedCount}/{achievements.length}
              </p>
              <p className="text-xs text-muted-foreground">Logros</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievements Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Mis Logros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`relative rounded-xl p-4 border transition-all ${
                    achievement.unlocked
                      ? "bg-gradient-to-br from-primary/10 to-emerald-500/10 border-primary/30"
                      : "bg-muted/30 border-border opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-3xl ${
                        achievement.unlocked ? "" : "grayscale"
                      }`}
                    >
                      {achievement.icono}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-semibold text-sm ${
                          achievement.unlocked
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {achievement.nombre}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {achievement.descripcion}
                      </p>
                      {!achievement.unlocked && (
                        <div className="mt-2 space-y-1">
                          <Progress
                            value={getProgressForAchievement(achievement)}
                            className="h-1.5"
                          />
                          <p className="text-xs text-muted-foreground">
                            {getProgressText(achievement)}
                          </p>
                        </div>
                      )}
                      {achievement.unlocked && achievement.unlocked_at && (
                        <p className="text-xs text-primary mt-1">
                          ✓ Desbloqueado{" "}
                          {format(new Date(achievement.unlocked_at), "dd MMM", {
                            locale: es,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Statistics and History */}
        <Tabs defaultValue="statistics" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Historial
            </TabsTrigger>
          </TabsList>
          <TabsContent value="statistics" className="mt-4">
            <StatisticsTab scans={scans} totalPoints={stats.puntos} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <ScanHistory scans={scans} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
