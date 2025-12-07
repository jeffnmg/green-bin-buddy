import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Calendar,
  Search,
  Package,
  Download,
  Filter,
  ArrowUpDown,
  ChevronDown,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { format, subDays, subMonths, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

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

interface ScanHistoryProps {
  scans: Scan[];
}

type DateRange = "all" | "week" | "month" | "3months";
type SortBy = "recent" | "confidence" | "points";
type ConfidenceLevel = "all" | "alta" | "media" | "baja";

const getConfidenceLevel = (confianza?: number): "alta" | "media" | "baja" => {
  if (!confianza) return "baja";
  if (confianza >= 80) return "alta";
  if (confianza >= 50) return "media";
  return "baja";
};

const getConfidenceColor = (level: "alta" | "media" | "baja") => {
  switch (level) {
    case "alta": return "bg-success/20 text-success";
    case "media": return "bg-yellow-500/20 text-yellow-600";
    case "baja": return "bg-destructive/20 text-destructive";
  }
};

export function ScanHistory({ scans }: ScanHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCaneca, setFilterCaneca] = useState<string>("all");
  const [filterReciclable, setFilterReciclable] = useState<string>("all");
  const [filterConfidence, setFilterConfidence] = useState<ConfidenceLevel>("all");
  const [filterOrigin, setFilterOrigin] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Extract unique values for filters
  const uniqueTypes = useMemo(() => 
    [...new Set(scans.map((s) => s.tipo_residuo).filter(Boolean))] as string[],
    [scans]
  );

  const uniqueCanecas = useMemo(() => 
    [...new Set(scans.map((s) => s.caneca).filter(Boolean))] as string[],
    [scans]
  );

  // Filter and sort scans
  const filteredScans = useMemo(() => {
    let result = scans.filter((scan) => {
      // Text search
      const matchesSearch =
        searchQuery === "" ||
        (scan.objeto_detectado_espanol || scan.objeto_detectado)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (scan.tipo_residuo || "").toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType = filterType === "all" || scan.tipo_residuo === filterType;

      // Caneca filter
      const matchesCaneca = filterCaneca === "all" || scan.caneca === filterCaneca;

      // Recyclable filter
      const matchesReciclable =
        filterReciclable === "all" ||
        (filterReciclable === "yes" && scan.reciclable) ||
        (filterReciclable === "no" && !scan.reciclable);

      // Confidence filter
      const confidenceLevel = getConfidenceLevel(scan.confianza);
      const matchesConfidence = filterConfidence === "all" || confidenceLevel === filterConfidence;

      // Origin filter
      const matchesOrigin = filterOrigin === "all" || scan.origen === filterOrigin;

      // Date range filter
      let matchesDate = true;
      const scanDate = new Date(scan.created_at);
      const now = new Date();
      
      switch (dateRange) {
        case "week":
          matchesDate = isAfter(scanDate, subDays(now, 7));
          break;
        case "month":
          matchesDate = isAfter(scanDate, subMonths(now, 1));
          break;
        case "3months":
          matchesDate = isAfter(scanDate, subMonths(now, 3));
          break;
      }

      return matchesSearch && matchesType && matchesCaneca && matchesReciclable && 
             matchesConfidence && matchesOrigin && matchesDate;
    });

    // Sort
    switch (sortBy) {
      case "recent":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "confidence":
        result.sort((a, b) => (b.confianza || 0) - (a.confianza || 0));
        break;
      case "points":
        result.sort((a, b) => b.puntos_ganados - a.puntos_ganados);
        break;
    }

    return result;
  }, [scans, searchQuery, filterType, filterCaneca, filterReciclable, filterConfidence, filterOrigin, dateRange, sortBy]);

  // Statistics for filtered results
  const stats = useMemo(() => {
    const totalObjects = filteredScans.length;
    const totalPoints = filteredScans.reduce((sum, s) => sum + s.puntos_ganados, 0);
    
    // Find most common type
    const typeCount: Record<string, number> = {};
    filteredScans.forEach((s) => {
      const type = s.tipo_residuo || "Sin tipo";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    let mostCommonType = "N/A";
    let maxCount = 0;
    Object.entries(typeCount).forEach(([type, count]) => {
      if (count > maxCount) {
        mostCommonType = type;
        maxCount = count;
      }
    });

    return { totalObjects, totalPoints, mostCommonType };
  }, [filteredScans]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Fecha",
      "Objeto Detectado",
      "Objeto (Original)",
      "Tipo de Residuo",
      "Caneca",
      "Reciclable",
      "Confianza (%)",
      "Puntos Ganados",
      "Origen"
    ];

    const rows = scans.map((scan) => [
      format(new Date(scan.created_at), "yyyy-MM-dd HH:mm:ss"),
      scan.objeto_detectado_espanol || scan.objeto_detectado,
      scan.objeto_detectado,
      scan.tipo_residuo || "",
      scan.caneca || "",
      scan.reciclable ? "Sí" : "No",
      scan.confianza?.toString() || "",
      scan.puntos_ganados.toString(),
      scan.origen
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historial_escaneos_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV descargado exitosamente");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterCaneca("all");
    setFilterReciclable("all");
    setFilterConfidence("all");
    setFilterOrigin("all");
    setDateRange("all");
    setSortBy("recent");
  };

  const hasActiveFilters = 
    searchQuery !== "" || filterType !== "all" || filterCaneca !== "all" ||
    filterReciclable !== "all" || filterConfidence !== "all" || 
    filterOrigin !== "all" || dateRange !== "all";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Historial de Escaneos
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar CSV</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics for filtered results */}
        {filteredScans.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Package className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground">{stats.totalObjects}</p>
              <p className="text-xs text-muted-foreground">Objetos</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <TrendingUp className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-foreground">{stats.totalPoints}</p>
              <p className="text-xs text-muted-foreground">Puntos</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <BarChart3 className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-bold text-foreground truncate">{stats.mostCommonType}</p>
              <p className="text-xs text-muted-foreground">Más común</p>
            </div>
          </div>
        )}

        {/* Search and basic filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por objeto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el tiempo</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-full sm:w-40">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más reciente</SelectItem>
              <SelectItem value="confidence">Mayor confianza</SelectItem>
              <SelectItem value="points">Más puntos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced filters toggle */}
        <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros avanzados
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">Activos</Badge>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo residuo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCaneca} onValueChange={setFilterCaneca}>
                <SelectTrigger>
                  <SelectValue placeholder="Caneca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las canecas</SelectItem>
                  {uniqueCanecas.map((caneca) => (
                    <SelectItem key={caneca} value={caneca}>
                      {caneca}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterReciclable} onValueChange={setFilterReciclable}>
                <SelectTrigger>
                  <SelectValue placeholder="Reciclable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">♻️ Reciclables</SelectItem>
                  <SelectItem value="no">🗑️ No reciclables</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterConfidence} onValueChange={(v) => setFilterConfidence(v as ConfidenceLevel)}>
                <SelectTrigger>
                  <SelectValue placeholder="Confianza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toda confianza</SelectItem>
                  <SelectItem value="alta">🟢 Alta (+80%)</SelectItem>
                  <SelectItem value="media">🟡 Media (50-80%)</SelectItem>
                  <SelectItem value="baja">🔴 Baja (-50%)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                <SelectTrigger>
                  <SelectValue placeholder="Origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="web">🌐 Web</SelectItem>
                  <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="mt-3 text-muted-foreground"
              >
                Limpiar todos los filtros
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Scan List */}
        {filteredScans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay escaneos que coincidan</p>
            {hasActiveFilters && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={clearFilters}
                className="mt-2"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Mostrando {Math.min(filteredScans.length, 50)} de {filteredScans.length} escaneos
            </p>
            {filteredScans.slice(0, 50).map((scan) => {
              const confidenceLevel = getConfidenceLevel(scan.confianza);
              
              return (
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        {scan.tipo_residuo} • {scan.caneca}
                      </p>
                      {scan.confianza && (
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0 ${getConfidenceColor(confidenceLevel)}`}
                        >
                          {scan.confianza}%
                        </Badge>
                      )}
                    </div>
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}