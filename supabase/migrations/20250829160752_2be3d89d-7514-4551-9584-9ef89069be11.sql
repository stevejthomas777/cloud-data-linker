-- Fix security vulnerability: Restrict users table access to own data only
DROP POLICY IF EXISTS "Users can view all users" ON public.users;

-- Create new secure policy that only allows users to view their own data
CREATE POLICY "Users can view their own data only" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);