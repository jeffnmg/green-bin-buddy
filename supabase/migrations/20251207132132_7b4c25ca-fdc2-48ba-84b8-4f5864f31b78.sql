-- Drop and recreate the view with security_invoker = false (default)
-- This ensures the view runs with owner's permissions, not the caller's
DROP VIEW IF EXISTS public.leaderboard_users;

CREATE VIEW public.leaderboard_users 
WITH (security_invoker = false)
AS
SELECT 
  id,
  username,
  puntos,
  objetos_escaneados,
  racha_actual,
  racha_maxima
FROM public.users;

-- Grant select permission to authenticated users
GRANT SELECT ON public.leaderboard_users TO authenticated;