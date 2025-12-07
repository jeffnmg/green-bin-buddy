-- Drop the current view
DROP VIEW IF EXISTS public.leaderboard_users;

-- Create a security definer function that only returns public leaderboard data
-- This safely exposes only non-sensitive columns
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  id uuid,
  username text,
  puntos integer,
  objetos_escaneados integer,
  racha_actual integer,
  racha_maxima integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    username,
    puntos,
    objetos_escaneados,
    racha_actual,
    racha_maxima
  FROM public.users
  ORDER BY puntos DESC;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO anon;

-- Recreate the view using the secure function
CREATE VIEW public.leaderboard_users AS
SELECT * FROM public.get_leaderboard();

-- Grant select on the view
GRANT SELECT ON public.leaderboard_users TO authenticated;
GRANT SELECT ON public.leaderboard_users TO anon;