-- Remove the overly permissive policy we just created
DROP POLICY IF EXISTS "Anyone can view leaderboard data" ON public.users;