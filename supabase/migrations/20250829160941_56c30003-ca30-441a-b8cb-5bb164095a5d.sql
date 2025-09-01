-- Fix security vulnerability: Restrict submissions access to form owners only
DROP POLICY IF EXISTS "Users can view submissions by user_id" ON public.submissions;

-- Create new secure policy that only allows form owners to view their form submissions
CREATE POLICY "Form owners can view their form submissions" 
ON public.submissions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.forms 
    WHERE forms.id = submissions.form_id 
    AND forms.user_id = auth.uid()
  )
);