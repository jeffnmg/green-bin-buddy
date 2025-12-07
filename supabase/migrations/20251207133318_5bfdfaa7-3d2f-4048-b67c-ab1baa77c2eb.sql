-- Drop the existing view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboard_users;

CREATE VIEW public.leaderboard_users 
WITH (security_invoker = true)
AS SELECT 
  id,
  username,
  puntos,
  objetos_escaneados,
  racha_actual,
  racha_maxima
FROM public.users;

-- Grant select permission to authenticated and anon roles for the leaderboard
GRANT SELECT ON public.leaderboard_users TO authenticated;
GRANT SELECT ON public.leaderboard_users TO anon;

-- Create a policy on the users table to allow reading public leaderboard data
-- This policy allows anyone to read the leaderboard-relevant columns
CREATE POLICY "Anyone can view leaderboard data"
ON public.users
FOR SELECT
USING (true);