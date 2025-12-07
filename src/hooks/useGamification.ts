import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ScanData {
  objeto_detectado: string;
  objeto_detectado_espanol?: string;
  tipo?: string;
  caneca?: string;
  reciclable?: boolean;
  confianza?: number;
  imagen_url?: string;
}

interface Achievement {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
}

export function useGamification() {
  const { user, profile } = useAuth();

  const checkAchievements = async (userId: string): Promise<Achievement[]> => {
    if (!userId) return [];

    try {
      // Get current user stats
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('puntos, objetos_escaneados, racha_actual, racha_maxima')
        .eq('id', userId)
        .single();

      if (userError || !userData) return [];

      // Get all active achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('activo', true);

      if (achievementsError || !allAchievements) return [];

      // Get user's already unlocked achievements
      const { data: unlockedAchievements, error: unlockedError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      if (unlockedError) return [];

      const unlockedIds = new Set((unlockedAchievements || []).map(ua => ua.achievement_id));
      const newlyUnlocked: Achievement[] = [];

      // Check each achievement
      for (const achievement of allAchievements) {
        if (unlockedIds.has(achievement.id)) continue;

        let qualifies = false;

        switch (achievement.tipo) {
          case 'puntos':
            qualifies = userData.puntos >= achievement.umbral;
            break;
          case 'escaneos':
            qualifies = userData.objetos_escaneados >= achievement.umbral;
            break;
          case 'racha':
            qualifies = userData.racha_actual >= achievement.umbral || userData.racha_maxima >= achievement.umbral;
            break;
        }

        if (qualifies) {
          // Insert new achievement
          const { error: insertError } = await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
            });

          if (!insertError) {
            newlyUnlocked.push({
              id: achievement.id,
              nombre: achievement.nombre,
              descripcion: achievement.descripcion,
              icono: achievement.icono,
            });
          }
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  };

  const registerScan = async (scanData: ScanData): Promise<{ success: boolean; newAchievements: Achievement[] }> => {
    if (!user || !profile) {
      console.warn('No user logged in, scan not saved');
      return { success: false, newAchievements: [] };
    }

    try {
      // Get the user's id from users table (not auth.users)
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, puntos, objetos_escaneados, racha_actual, racha_maxima, ultimo_escaneo')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userRecord) {
        console.error('Error fetching user record:', userError);
        return { success: false, newAchievements: [] };
      }

      const userId = userRecord.id;
      const puntosGanados = 10;
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Check streak logic
      let nuevaRacha = userRecord.racha_actual;
      let rachaMaxima = userRecord.racha_maxima;

      if (userRecord.ultimo_escaneo) {
        const lastScanDate = new Date(userRecord.ultimo_escaneo).toISOString().split('T')[0];
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastScanDate === today) {
          // Same day, no streak change
        } else if (lastScanDate === yesterdayStr) {
          // Consecutive day, increment streak
          nuevaRacha = userRecord.racha_actual + 1;
        } else {
          // Streak broken, reset to 1
          nuevaRacha = 1;
        }
      } else {
        // First scan ever
        nuevaRacha = 1;
      }

      rachaMaxima = Math.max(rachaMaxima, nuevaRacha);

      // Insert scan record
      const { error: scanError } = await supabase
        .from('scans')
        .insert({
          user_id: userId,
          objeto_detectado: scanData.objeto_detectado || 'unknown',
          objeto_detectado_espanol: scanData.objeto_detectado_espanol,
          tipo_residuo: scanData.tipo,
          caneca: scanData.caneca,
          reciclable: scanData.reciclable ?? false,
          confianza: scanData.confianza,
          puntos_ganados: puntosGanados,
          origen: 'web',
          imagen_url: scanData.imagen_url,
        });

      if (scanError) {
        console.error('Error inserting scan:', scanError);
        return { success: false, newAchievements: [] };
      }

      // Update user stats
      const { error: updateError } = await supabase
        .from('users')
        .update({
          puntos: userRecord.puntos + puntosGanados,
          objetos_escaneados: userRecord.objetos_escaneados + 1,
          racha_actual: nuevaRacha,
          racha_maxima: rachaMaxima,
          ultimo_escaneo: now.toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user stats:', updateError);
        return { success: false, newAchievements: [] };
      }

      // Show points toast
      toast.success(`+${puntosGanados} puntos 🎉`, {
        description: nuevaRacha > 1 ? `🔥 Racha de ${nuevaRacha} días` : undefined,
      });

      // Check for new achievements
      const newAchievements = await checkAchievements(userId);

      // Show achievement toasts
      for (const achievement of newAchievements) {
        setTimeout(() => {
          toast.success(`${achievement.icono} ¡Logro desbloqueado!`, {
            description: `${achievement.nombre}: ${achievement.descripcion}`,
            duration: 5000,
          });
        }, 1000);
      }

      return { success: true, newAchievements };
    } catch (error) {
      console.error('Error registering scan:', error);
      return { success: false, newAchievements: [] };
    }
  };

  return {
    registerScan,
    checkAchievements,
  };
}
