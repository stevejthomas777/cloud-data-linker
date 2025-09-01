-- Fix the foreign key constraint to preserve submission data when forms are deleted
-- The current constraint has CASCADE delete which is causing data loss

-- Drop the existing foreign key constraint that cascades deletes
ALTER TABLE public.submissions 
DROP CONSTRAINT submissions_form_id_fkey;

-- Add a new foreign key constraint that preserves submissions when forms are deleted
ALTER TABLE public.submissions 
ADD CONSTRAINT submissions_form_id_fkey 
FOREIGN KEY (form_id) 
REFERENCES public.forms(id) 
ON DELETE SET NULL;  -- This will set form_id to NULL instead of deleting the submission

-- Add a comment to document this critical behavior
COMMENT ON CONSTRAINT submissions_form_id_fkey ON public.submissions IS 
'Preserves submission data when forms are deleted by setting form_id to NULL instead of cascading delete';