-- Fix critical security vulnerability: Restrict forms UPDATE and DELETE to form owners only
DROP POLICY IF EXISTS "Users can update their own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can delete their own forms" ON public.forms;

-- Create new secure policies that only allow form owners to modify their own forms
CREATE POLICY "Users can update their own forms" 
ON public.forms 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" 
ON public.forms 
FOR DELETE 
USING (auth.uid() = user_id);