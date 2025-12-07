-- Remove the overly permissive public policy that exposes all user data
DROP POLICY IF EXISTS "Anyone can view public user stats for leaderboard" ON public.users;

-- Create a secure view that only exposes non-sensitive fields for the leaderboard
CREATE OR REPLACE VIEW public.leaderboard_users AS
SELECT 
  id,
  username,
  puntos,
  objetos_escaneados,
  racha_actual,
  racha_maxima
FROM public.users;

-- Grant SELECT access on the view to anonymous and authenticated users
GRANT SELECT ON public.leaderboard_users TO anon, authenticated;