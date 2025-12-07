import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Trophy,
  Package,
  Flame,
  Star,
  Search,
  Calendar,
  User,
  LogOut,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

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
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterOrigin, setFilterOrigin] = useState<string>("all");

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

  const getLevel = (puntos: number) => Math.floor(puntos / 100);
  const getLevelProgress = (puntos: number) => puntos % 100;

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

  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      searchQuery === "" ||
      (scan.objeto_detectado_espanol || scan.objeto_detectado)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (scan.tipo_residuo || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "all" || scan.tipo_residuo === filterType;

    const matchesOrigin =
      filterOrigin === "all" || scan.origen === filterOrigin;

    return matchesSearch && matchesType && matchesOrigin;
  });

  const uniqueTypes = [...new Set(scans.map((s) => s.tipo_residuo).filter(Boolean))];
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

  const level = getLevel(stats.puntos);
  const levelProgress = getLevelProgress(stats.puntos);

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
        <Card className="bg-gradient-to-br from-primary/10 via-card to-emerald-500/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-4xl border-4 border-primary/30">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-foreground">
                  {stats.username}
                </h2>
                <p className="text-muted-foreground text-sm">{stats.email}</p>
                <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                  <Badge variant="secondary" className="text-sm">
                    Nivel {level}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {levelProgress}/100 para nivel {level + 1}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={levelProgress} className="h-2" />
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

        {/* Scan History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Historial de Escaneos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por objeto o tipo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type!}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="web">🌐 Web</SelectItem>
                  <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scan List */}
            {filteredScans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay escaneos que coincidan</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredScans.slice(0, 20).map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        scan.reciclable
                          ? "bg-emerald-500/20 text-emerald-600"
                          : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {scan.reciclable ? "♻️" : "🗑️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {scan.objeto_detectado_espanol || scan.objeto_detectado}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {scan.tipo_residuo} • {scan.caneca}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-primary">
                        +{scan.puntos_ganados}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {scan.origen === "whatsapp" ? "📱" : "🌐"}{" "}
                        {format(new Date(scan.created_at), "dd/MM", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
