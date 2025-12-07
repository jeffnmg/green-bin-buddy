import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Download, TrendingUp, Calendar, Target, Recycle, Percent } from "lucide-react";
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import html2canvas from "html2canvas";

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

interface StatisticsTabProps {
  scans: Scan[];
  totalPoints: number;
}

const WASTE_COLORS: Record<string, string> = {
  "Plástico": "hsl(200, 80%, 50%)",
  "Vidrio": "hsl(120, 60%, 45%)",
  "Metal": "hsl(40, 70%, 50%)",
  "Papel": "hsl(30, 60%, 55%)",
  "Orgánico": "hsl(80, 60%, 40%)",
  "Electrónico": "hsl(270, 60%, 55%)",
  "Peligroso": "hsl(0, 70%, 50%)",
  "Otros": "hsl(220, 15%, 55%)",
};

export function StatisticsTab({ scans, totalPoints }: StatisticsTabProps) {
  const [dateRange, setDateRange] = useState<"week" | "month">("week");
  const chartsRef = useRef<HTMLDivElement>(null);

  // Filter scans by date range
  const filteredScans = useMemo(() => {
    const daysBack = dateRange === "week" ? 7 : 30;
    const cutoffDate = startOfDay(subDays(new Date(), daysBack));
    return scans.filter((scan) => isAfter(new Date(scan.created_at), cutoffDate));
  }, [scans, dateRange]);

  // Scans per day data
  const scansPerDay = useMemo(() => {
    const daysBack = dateRange === "week" ? 7 : 30;
    const days: Record<string, number> = {};
    
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      days[date] = 0;
    }
    
    filteredScans.forEach((scan) => {
      const date = format(new Date(scan.created_at), "yyyy-MM-dd");
      if (days[date] !== undefined) {
        days[date]++;
      }
    });

    return Object.entries(days).map(([date, count]) => ({
      date: format(new Date(date), dateRange === "week" ? "EEE" : "dd/MM", { locale: es }),
      escaneos: count,
    }));
  }, [filteredScans, dateRange]);

  // Waste type distribution
  const wasteDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    
    filteredScans.forEach((scan) => {
      const tipo = scan.tipo_residuo || "Otros";
      distribution[tipo] = (distribution[tipo] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([name, value]) => ({
        name,
        value,
        color: WASTE_COLORS[name] || WASTE_COLORS["Otros"],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredScans]);

  // Points evolution
  const pointsEvolution = useMemo(() => {
    const daysBack = dateRange === "week" ? 7 : 30;
    const days: Record<string, number> = {};
    let cumulativePoints = totalPoints;

    // Calculate points per day going backwards
    const dailyPoints: Record<string, number> = {};
    filteredScans.forEach((scan) => {
      const date = format(new Date(scan.created_at), "yyyy-MM-dd");
      dailyPoints[date] = (dailyPoints[date] || 0) + scan.puntos_ganados;
    });

    // Go backwards to build cumulative
    const sortedDays: { date: string; puntos: number }[] = [];
    for (let i = 0; i < daysBack; i++) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      cumulativePoints -= (dailyPoints[date] || 0);
    }

    for (let i = daysBack - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      cumulativePoints += (dailyPoints[date] || 0);
      sortedDays.push({
        date: format(new Date(date), dateRange === "week" ? "EEE" : "dd/MM", { locale: es }),
        puntos: cumulativePoints,
      });
    }

    return sortedDays;
  }, [filteredScans, totalPoints, dateRange]);

  // Metrics
  const metrics = useMemo(() => {
    if (filteredScans.length === 0) {
      return {
        avgConfidence: 0,
        busyDay: "-",
        mostScanned: "-",
        recyclablePercent: 0,
      };
    }

    // Average confidence
    const scansWithConfidence = filteredScans.filter((s) => s.confianza != null);
    const avgConfidence = scansWithConfidence.length > 0
      ? Math.round(
          scansWithConfidence.reduce((acc, s) => acc + (s.confianza || 0), 0) /
            scansWithConfidence.length * 100
        )
      : 0;

    // Busiest day
    const dayCount: Record<string, number> = {};
    filteredScans.forEach((scan) => {
      const day = format(new Date(scan.created_at), "EEEE", { locale: es });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    const busyDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    // Most scanned waste
    const wasteCount: Record<string, number> = {};
    filteredScans.forEach((scan) => {
      const tipo = scan.tipo_residuo || "Otros";
      wasteCount[tipo] = (wasteCount[tipo] || 0) + 1;
    });
    const mostScanned = Object.entries(wasteCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    // Recyclable percentage
    const recyclableCount = filteredScans.filter((s) => s.reciclable).length;
    const recyclablePercent = Math.round((recyclableCount / filteredScans.length) * 100);

    return { avgConfidence, busyDay, mostScanned, recyclablePercent };
  }, [filteredScans]);

  const exportCharts = async () => {
    if (!chartsRef.current) return;
    
    try {
      toast.loading("Generando imagen...");
      const canvas = await html2canvas(chartsRef.current, {
        backgroundColor: "hsl(145, 30%, 97%)",
        scale: 2,
      });
      
      const link = document.createElement("a");
      link.download = `estadisticas-reciclaje-${format(new Date(), "yyyy-MM-dd")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.dismiss();
      toast.success("Imagen descargada");
    } catch (error) {
      toast.dismiss();
      toast.error("Error al exportar");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Estadísticas
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v: "week" | "month") => setDateRange(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCharts}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6" ref={chartsRef}>
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-500/10 to-card border-blue-500/20">
            <CardContent className="pt-4 text-center">
              <Target className="w-6 h-6 mx-auto text-blue-500 mb-1" />
              <p className="text-xl font-bold text-foreground">{metrics.avgConfidence}%</p>
              <p className="text-xs text-muted-foreground">Confianza promedio</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-card border-purple-500/20">
            <CardContent className="pt-4 text-center">
              <Calendar className="w-6 h-6 mx-auto text-purple-500 mb-1" />
              <p className="text-xl font-bold text-foreground capitalize">{metrics.busyDay}</p>
              <p className="text-xs text-muted-foreground">Día más activo</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-card border-emerald-500/20">
            <CardContent className="pt-4 text-center">
              <Recycle className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
              <p className="text-xl font-bold text-foreground truncate">{metrics.mostScanned}</p>
              <p className="text-xs text-muted-foreground">Más escaneado</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-card border-green-500/20">
            <CardContent className="pt-4 text-center">
              <Percent className="w-6 h-6 mx-auto text-green-500 mb-1" />
              <p className="text-xl font-bold text-foreground">{metrics.recyclablePercent}%</p>
              <p className="text-xs text-muted-foreground">Reciclables</p>
            </CardContent>
          </Card>
        </div>

        {/* Scans per Day Chart */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            📊 Escaneos por día
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scansPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar 
                  dataKey="escaneos" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="Escaneos"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two charts side by side on larger screens */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Waste Distribution Pie Chart */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              🗑️ Distribución por tipo
            </h3>
            <div className="h-64 w-full">
              {wasteDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wasteDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => 
                        percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                      }
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {wasteDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value} escaneos`, "Cantidad"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Sin datos en este período
                </div>
              )}
            </div>
          </div>

          {/* Points Evolution Line Chart */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              📈 Evolución de puntos
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pointsEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [`${value} pts`, "Puntos"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="puntos" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                    name="Puntos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Badge variant="outline" className="text-sm">
            {filteredScans.length} escaneos en {dateRange === "week" ? "7 días" : "30 días"}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {filteredScans.reduce((acc, s) => acc + s.puntos_ganados, 0)} puntos ganados
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
