import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getLevelInfo } from "@/lib/levelSystem";
import { useToast } from "@/hooks/use-toast";
interface Message {
  id: string;
  type: "user" | "bot";
  text: string;
}
interface ChatAchievement {
  id: string;
  nombre: string;
  descripcion: string;
  umbral: number;
  tipo: string;
  icono: string;
  unlocked: boolean;
}
const PREDEFINED_QUESTIONS = [{
  id: "recycle",
  text: "¿Dónde reciclo mis residuos?"
}, {
  id: "points",
  text: "¿Cuántos puntos necesito para el siguiente nivel?"
}, {
  id: "achievements",
  text: "¿Qué logros me faltan?"
}, {
  id: "streak",
  text: "¿Cómo funciona la racha?"
}];
const RECYCLING_LOCATIONS: Record<string, string> = {
  "Plástico": "Los plásticos van en la caneca blanca. Puedes encontrar puntos de reciclaje en supermercados y centros comerciales.",
  "Vidrio": "El vidrio va en la caneca blanca. Busca contenedores específicos para vidrio en tu zona o llévalo a puntos ecológicos.",
  "Metal": "Los metales van en la caneca blanca. Las chatarrerías y puntos ecológicos los reciben.",
  "Papel": "El papel y cartón van en la caneca blanca. Asegúrate de que estén secos y limpios.",
  "Orgánico": "Los residuos orgánicos van en la caneca verde. Puedes hacer compostaje en casa o usar los puntos de compostaje comunitario.",
  "No reciclable": "Los residuos no reciclables van en la caneca negra. Reduce su uso siempre que sea posible."
};
export function ChatWidget() {
  const {
    profile,
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [achievements, setAchievements] = useState<ChatAchievement[]>([]);
  const [recentWasteTypes, setRecentWasteTypes] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userInternalId, setUserInternalId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (user && isOpen) {
      fetchUserData();
    }
  }, [user, isOpen]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: "welcome",
        type: "bot",
        text: `¡Hola${profile?.username ? ` ${profile.username}` : ""}! 👋 Soy tu asistente de reciclaje. ¿En qué puedo ayudarte?`
      }]);
    }
  }, [isOpen, profile?.username]);
  const fetchUserData = async () => {
    if (!user) return;

    // Fetch user's internal ID
    const {
      data: userData
    } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (!userData) return;
    setUserInternalId(userData.id);

    // Fetch achievements
    const {
      data: allAchievements
    } = await supabase.from("achievements").select("*").eq("activo", true);
    const {
      data: userAchievements
    } = await supabase.from("user_achievements").select("achievement_id").eq("user_id", userData.id);
    const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
    setAchievements((allAchievements || []).map(a => ({
      ...a,
      unlocked: unlockedIds.has(a.id)
    })));

    // Fetch recent waste types
    const {
      data: recentScans
    } = await supabase.from("scans").select("tipo_residuo").eq("user_id", userData.id).order("created_at", {
      ascending: false
    }).limit(5);
    const types = [...new Set(recentScans?.map(s => s.tipo_residuo).filter(Boolean) as string[])];
    setRecentWasteTypes(types);
  };
  const generateResponse = (questionId: string): string => {
    const points = profile?.puntos || 0;
    const streak = profile?.racha_actual || 0;
    const scannedObjects = profile?.objetos_escaneados || 0;
    const levelInfo = getLevelInfo(points);
    const pointsToNextLevel = (levelInfo.level + 1) * 100 - points;
    switch (questionId) {
      case "recycle":
        if (recentWasteTypes.length > 0) {
          const tips = recentWasteTypes.slice(0, 3).map(type => `• **${type}**: ${RECYCLING_LOCATIONS[type] || "Consulta tu punto ecológico más cercano."}`).join("\n");
          return `Basándome en tus escaneos recientes, aquí tienes información:\n\n${tips}\n\n¿Necesitas información sobre otro tipo de residuo?`;
        }
        return "Aún no tienes escaneos. ¡Escanea un residuo y te diré dónde reciclarlo! Los puntos ecológicos de tu ciudad son un excelente lugar para llevar tus reciclables.";
      case "points":
        return `🎯 Actualmente tienes **${points} puntos** y estás en el nivel **${levelInfo.level}** (${levelInfo.title}).\n\nTe faltan **${pointsToNextLevel} puntos** para alcanzar el nivel ${levelInfo.level + 1}.\n\n¡Cada escaneo te da 10 puntos! Eso significa que necesitas escanear aproximadamente **${Math.ceil(pointsToNextLevel / 10)} residuos** más.`;
      case "achievements":
        const lockedAchievements = achievements.filter(a => !a.unlocked);
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        if (lockedAchievements.length === 0) {
          return "🏆 ¡Increíble! Has desbloqueado todos los logros disponibles. ¡Eres un verdadero maestro del reciclaje!";
        }
        const nextAchievements = lockedAchievements.slice(0, 3).map(a => {
          let progress = "";
          if (a.tipo === "points") {
            progress = `(${points}/${a.umbral} puntos)`;
          } else if (a.tipo === "scans") {
            progress = `(${scannedObjects}/${a.umbral} escaneos)`;
          } else if (a.tipo === "streak") {
            progress = `(${streak}/${a.umbral} días)`;
          }
          return `• ${a.icono} **${a.nombre}**: ${a.descripcion} ${progress}`;
        }).join("\n");
        return `Has desbloqueado **${unlockedCount}/${achievements.length}** logros.\n\nPróximos logros a conseguir:\n${nextAchievements}`;
      case "streak":
        const streakStatus = streak > 0 ? `Tu racha actual es de **${streak} día${streak > 1 ? "s" : ""}** 🔥` : "Actualmente no tienes una racha activa.";
        return `${streakStatus}\n\n📅 **¿Cómo funciona?**\n• Escanea al menos un residuo cada día para mantener tu racha\n• Si no escaneas durante un día, la racha se reinicia a 0\n• Las rachas largas desbloquean logros especiales\n\n¡Intenta escanear algo hoy para mantener o iniciar tu racha!`;
      default:
        return "No entendí tu pregunta. Por favor, selecciona una de las opciones disponibles.";
    }
  };
  const handleQuestionClick = (questionId: string, questionText: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      text: questionText
    };
    const botResponse: Message = {
      id: `bot-${Date.now()}`,
      type: "bot",
      text: generateResponse(questionId)
    };
    setMessages(prev => [...prev, userMessage, botResponse]);
  };
  const sendMessageToAI = async (message: string) => {
    if (!message.trim() || isLoading) return;
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      text: message
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("chat", {
        body: {
          message
        }
      });
      if (error) throw error;
      const botResponse: Message = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: data.response || "Lo siento, no pude procesar tu pregunta."
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("Error calling chat function:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener respuesta del asistente.",
        variant: "destructive"
      });
      const errorMessage: Message = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: "Lo siento, ocurrió un error. Por favor intenta de nuevo."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageToAI(inputMessage);
  };
  const formatMessage = (text: string) => {
    return text.split("\n").map((line, i) => {
      // Handle bold text
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <span key={i} dangerouslySetInnerHTML={{
        __html: formattedLine
      }} className="block" />;
    });
  };
  if (!user) return null;
  return <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Window */}
      {isOpen && <div className="mb-4 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-primary p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <span className="text-xl">♻️</span>
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">EcoBot</h3>
                <p className="text-xs text-primary-foreground/80">Siempre disponible</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-primary-foreground hover:bg-primary-foreground/20">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="h-64 p-4">
            <div className="space-y-4">
              {messages.map(message => <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${message.type === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                    {formatMessage(message.text)}
                  </div>
                </div>)}
              {isLoading && <div className="flex justify-start">
                  <div className="bg-muted text-foreground rounded-2xl rounded-bl-md p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Text Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-border flex gap-2">
            <Input value={inputMessage} onChange={e => setInputMessage(e.target.value)} placeholder="Escribe tu pregunta..." className="flex-1 text-sm" disabled={isLoading} />
            <Button type="submit" size="icon" disabled={isLoading || !inputMessage.trim()} className="shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>

          {/* Quick Questions */}
          <div className="p-4 border-t border-border bg-background/50">
            <p className="text-xs text-muted-foreground mb-3">Preguntas frecuentes:</p>
            <div className="grid grid-cols-2 gap-2">
              {PREDEFINED_QUESTIONS.map(q => <Button key={q.id} variant="outline" size="sm" className="text-xs h-auto py-2 px-3 whitespace-normal text-left justify-start" onClick={() => handleQuestionClick(q.id, q.text)}>
                  {q.text}
                </Button>)}
            </div>
          </div>
        </div>}

      {/* Toggle Button */}
      <Button onClick={() => setIsOpen(!isOpen)} size="lg" className={`rounded-full w-14 h-14 shadow-lg transition-all duration-300 ${isOpen ? "bg-muted hover:bg-muted/80 text-foreground" : "bg-primary hover:bg-primary/90"}`}>
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>;
}