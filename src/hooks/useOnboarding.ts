import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ONBOARDING_KEY_PREFIX = "ecoscan_onboarding_completed_";

const getOnboardingKey = (userId: string) => `${ONBOARDING_KEY_PREFIX}${userId}`;

export function useOnboarding() {
  const { user, profile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show onboarding when user is authenticated (don't wait for profile)
    if (user) {
      checkOnboardingStatus(user.id);
    } else {
      setShowOnboarding(false);
      setLoading(false);
    }
  }, [user]);

  const checkOnboardingStatus = (userId: string) => {
    // Check localStorage with user-specific key
    const completed = localStorage.getItem(getOnboardingKey(userId));
    
    if (completed) {
      setShowOnboarding(false);
    } else {
      // Show onboarding for users who haven't seen it
      setShowOnboarding(true);
    }
    setLoading(false);
  };

  const completeOnboarding = useCallback(async () => {
    if (!user) return;
    
    // Save to localStorage with user-specific key
    localStorage.setItem(getOnboardingKey(user.id), "true");
    setShowOnboarding(false);

    // Award bonus points and achievement
    if (user && profile) {
      try {
        // Get user record
        const { data: userRecord } = await supabase
          .from("users")
          .select("id, puntos")
          .eq("auth_user_id", user.id)
          .single();

        if (userRecord) {
          // Add 5 bonus points
          await supabase
            .from("users")
            .update({ puntos: userRecord.puntos + 5 })
            .eq("id", userRecord.id);

          // Find and unlock "Primer Paso" achievement
          const { data: achievement } = await supabase
            .from("achievements")
            .select("id")
            .eq("nombre", "Primer Paso")
            .maybeSingle();

          if (achievement) {
            // Check if already unlocked
            const { data: existing } = await supabase
              .from("user_achievements")
              .select("id")
              .eq("user_id", userRecord.id)
              .eq("achievement_id", achievement.id)
              .maybeSingle();

            if (!existing) {
              await supabase
                .from("user_achievements")
                .insert({
                  user_id: userRecord.id,
                  achievement_id: achievement.id,
                });

              toast.success("🎓 ¡Logro desbloqueado: Primer Paso!", {
                description: "+5 puntos de bienvenida",
                duration: 5000,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error awarding onboarding bonus:", error);
      }
    }
  }, [user, profile]);

  const skipOnboarding = useCallback(() => {
    if (!user) return;
    localStorage.setItem(getOnboardingKey(user.id), "true");
    setShowOnboarding(false);
  }, [user]);

  const resetOnboarding = useCallback(() => {
    if (!user) return;
    localStorage.removeItem(getOnboardingKey(user.id));
    setShowOnboarding(true);
  }, [user]);

  return {
    showOnboarding,
    loading,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}