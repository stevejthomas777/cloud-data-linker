-- Add user_id to submissions table to track which user the submission belongs to
-- This way we can preserve submissions even when forms are deleted
ALTER TABLE public.submissions 
ADD COLUMN user_id UUID;

-- Update existing submissions to have the correct user_id based on their form
UPDATE public.submissions 
SET user_id = forms.user_id 
FROM public.forms 
WHERE submissions.form_id = forms.id;

-- Create index for better performance when querying submissions by user
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);

-- Update RLS policies to work with user_id
DROP POLICY IF EXISTS "Form owners can view submissions" ON public.submissions;

-- Create security definer function to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE POLICY "Users can view their own submissions" 
ON public.submissions 
FOR SELECT 
USING (user_id = public.get_current_user_id() OR 
       EXISTS (
         SELECT 1 FROM public.forms 
         WHERE forms.id = submissions.form_id 
         AND forms.user_id = public.get_current_user_id()
       ));

-- Create trigger to automatically set user_id when new submissions are created
CREATE OR REPLACE FUNCTION public.set_submission_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the user_id from the form
  SELECT user_id INTO NEW.user_id
  FROM public.forms
  WHERE id = NEW.form_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_submission_user_id_trigger
  BEFORE INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_submission_user_id();