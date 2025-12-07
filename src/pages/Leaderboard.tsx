import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trophy, Package, Flame, RefreshCw, Crown } from "lucide-react";
import { getLevelInfo, getLevelEmoji } from "@/lib/levelSystem";
import { toast } from "sonner";

interface LeaderboardUser {
  id: string;
  username: string;
  puntos: number;
  objetos_escaneados: number;
  racha_actual: number;
  racha_maxima: number;
}

type TabType = "puntos" | "escaneos" | "racha";

const getMedal = (position: number) => {
  switch (position) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return `#${position}`;
  }
};

const anonymizeUsername = (username: string): string => {
  if (username.length <= 4) {
    return `${username.charAt(0)}***`;
  }
  const visibleStart = username.substring(0, 2);
  const visibleEnd = username.substring(username.length - 2);
  return `${visibleStart}****${visibleEnd}`;
};

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("puntos");
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentUserStats, setCurrentUserStats] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async (tab: TabType) => {
    try {
      let orderColumn = "puntos";
      if (tab === "escaneos") orderColumn = "objetos_escaneados";
      if (tab === "racha") orderColumn = "racha_maxima";

      const { data, error } = await supabase
        .from("users")
        .select("id, username, puntos, objetos_escaneados, racha_actual, racha_maxima")
        .order(orderColumn, { ascending: false })
        .limit(10);

      if (error) throw error;
      setLeaderboard(data || []);

      // Find current user's rank
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, username, puntos, objetos_escaneados, racha_actual, racha_maxima")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (userData) {
          setCurrentUserStats(userData);
          
          // Get user's rank
          let rankColumn = "puntos";
          let userValue = userData.puntos;
          if (tab === "escaneos") {
            rankColumn = "objetos_escaneados";
            userValue = userData.objetos_escaneados;
          }
          if (tab === "racha") {
            rankColumn = "racha_maxima";
            userValue = userData.racha_maxima;
          }

          const { count } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .gt(rankColumn, userValue);

          setCurrentUserRank((count || 0) + 1);
        }
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Error cargando el ranking");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab, fetchLeaderboard]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
        },
        () => {
          fetchLeaderboard(activeTab);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, fetchLeaderboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard(activeTab);
  };

  const getStatValue = (user: LeaderboardUser) => {
    switch (activeTab) {
      case "puntos": return user.puntos;
      case "escaneos": return user.objetos_escaneados;
      case "racha": return user.racha_maxima;
    }
  };

  const getStatLabel = () => {
    switch (activeTab) {
      case "puntos": return "pts";
      case "escaneos": return "escaneos";
      case "racha": return "días";
    }
  };

  const getTop10ThresholdValue = () => {
    if (leaderboard.length < 10) return 0;
    const tenth = leaderboard[9];
    return getStatValue(tenth);
  };

  const getMotivationalMessage = () => {
    if (!currentUserRank || !currentUserStats) return null;
    
    if (currentUserRank <= 10) {
      return {
        type: "success" as const,
        message: "🎉 ¡Estás entre los mejores 10!",
      };
    }
    
    const top10Value = getTop10ThresholdValue();
    const currentValue = getStatValue(currentUserStats);
    const difference = top10Value - currentValue + 1;
    
    let unit = "";
    switch (activeTab) {
      case "puntos": unit = "puntos"; break;
      case "escaneos": unit = "escaneos"; break;
      case "racha": unit = "días de racha"; break;
    }
    
    return {
      type: "motivate" as const,
      message: `💪 Estás a ${difference} ${unit} del top 10`,
    };
  };

  const isCurrentUser = (userId: string) => {
    return currentUserStats?.id === userId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const motivationalMessage = getMotivationalMessage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="font-semibold flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Ranking
          </h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="puntos" className="gap-1.5">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Puntos</span>
            </TabsTrigger>
            <TabsTrigger value="escaneos" className="gap-1.5">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Escaneos</span>
            </TabsTrigger>
            <TabsTrigger value="racha" className="gap-1.5">
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">Racha</span>
            </TabsTrigger>
          </TabsList>

          {/* Motivational Message */}
          {motivationalMessage && (
            <Card className={`mt-4 ${
              motivationalMessage.type === "success" 
                ? "bg-gradient-to-r from-primary/10 to-emerald-500/10 border-primary/30" 
                : "bg-gradient-to-r from-accent/50 to-muted border-border"
            }`}>
              <CardContent className="py-3 text-center">
                <p className={`text-sm font-medium ${
                  motivationalMessage.type === "success" ? "text-primary" : "text-muted-foreground"
                }`}>
                  {motivationalMessage.message}
                </p>
              </CardContent>
            </Card>
          )}

          {/* User's Current Position */}
          {currentUserRank && currentUserRank > 10 && currentUserStats && (
            <Card className="mt-4 border-primary/30 bg-primary/5">
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-10 text-center">
                    #{currentUserRank}
                  </span>
                  <LeaderboardEntry
                    user={currentUserStats}
                    position={currentUserRank}
                    statValue={getStatValue(currentUserStats)}
                    statLabel={getStatLabel()}
                    isCurrentUser={true}
                    showPosition={false}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <TabsContent value={activeTab} className="mt-4 space-y-2">
            {leaderboard.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No hay usuarios en el ranking todavía</p>
                </CardContent>
              </Card>
            ) : (
              leaderboard.map((user, index) => (
                <LeaderboardEntry
                  key={user.id}
                  user={user}
                  position={index + 1}
                  statValue={getStatValue(user)}
                  statLabel={getStatLabel()}
                  isCurrentUser={isCurrentUser(user.id)}
                  showPosition={true}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

interface LeaderboardEntryProps {
  user: LeaderboardUser;
  position: number;
  statValue: number;
  statLabel: string;
  isCurrentUser: boolean;
  showPosition: boolean;
}

function LeaderboardEntry({ 
  user, 
  position, 
  statValue, 
  statLabel, 
  isCurrentUser, 
  showPosition 
}: LeaderboardEntryProps) {
  const levelInfo = getLevelInfo(user.puntos);
  const levelEmoji = getLevelEmoji(levelInfo.tier);
  const isTopThree = position <= 3;

  return (
    <Card className={`transition-all ${
      isCurrentUser 
        ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
        : isTopThree
          ? "bg-gradient-to-r from-amber-500/5 to-card border-amber-500/20"
          : ""
    }`}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          {/* Position */}
          {showPosition && (
            <div className={`w-10 text-center font-bold ${
              isTopThree ? "text-2xl" : "text-lg text-muted-foreground"
            }`}>
              {getMedal(position)}
            </div>
          )}

          {/* Avatar with level */}
          <div className="relative">
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 ${levelInfo.borderColor} ${levelInfo.bgColor}`}
            >
              {levelEmoji}
            </div>
            <div 
              className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold border border-background px-0.5"
              style={{ backgroundColor: levelInfo.color, color: 'white' }}
            >
              {levelInfo.level}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
              {isCurrentUser ? user.username : anonymizeUsername(user.username)}
              {isCurrentUser && (
                <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  Tú
                </span>
              )}
            </p>
            <p className={`text-xs ${levelInfo.textColor}`}>
              {levelInfo.title}
            </p>
          </div>

          {/* Stat Value */}
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">{statValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{statLabel}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}