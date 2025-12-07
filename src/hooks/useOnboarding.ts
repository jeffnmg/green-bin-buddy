import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ONBOARDING_KEY = "ecoscan_onboarding_completed";

export function useOnboarding() {
  const { user, profile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      checkOnboardingStatus();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const checkOnboardingStatus = () => {
    // Check localStorage first
    const completed = localStorage.getItem(ONBOARDING_KEY);
    
    if (completed) {
      setShowOnboarding(false);
    } else {
      // Show onboarding for users who haven't seen it
      setShowOnboarding(true);
    }
    setLoading(false);
  };

  const completeOnboarding = useCallback(async () => {
    // Save to localStorage
    localStorage.setItem(ONBOARDING_KEY, "true");
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
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  }, []);

  return {
    showOnboarding,
    loading,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}