-- Fix critical security vulnerability: Restrict forms access to form owners only
DROP POLICY IF EXISTS "Users can view their own forms" ON public.forms;

-- Create new secure policy that only allows form owners to view their own forms
CREATE POLICY "Users can view their own forms" 
ON public.forms 
FOR SELECT 
USING (auth.uid() = user_id);