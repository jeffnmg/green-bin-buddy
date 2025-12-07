-- Enable realtime for users table to support live leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Create a policy to allow users to view other users' public stats for the leaderboard
CREATE POLICY "Anyone can view public user stats for leaderboard" 
ON public.users 
FOR SELECT 
USING (true);