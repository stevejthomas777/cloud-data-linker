-- Ensure submissions are preserved when forms are deleted
-- Add explicit constraints to prevent cascading deletes

-- First, check if there are any foreign key constraints that could cause issues
-- We want to make sure form_id in submissions does NOT cascade delete

-- If there's an existing foreign key constraint, we need to drop it and recreate without CASCADE
-- Let's check the current constraint
DO $$
BEGIN
    -- Drop any existing foreign key constraint on form_id if it has CASCADE DELETE
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'submissions' 
        AND ccu.column_name = 'form_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Find and drop the constraint
        EXECUTE (
            SELECT 'ALTER TABLE public.submissions DROP CONSTRAINT ' || tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'submissions' 
            AND ccu.column_name = 'form_id'
            AND tc.constraint_type = 'FOREIGN KEY'
            LIMIT 1
        );
    END IF;
END $$;

-- Add a foreign key constraint that does NOT cascade delete
-- This preserves submission data even when forms are deleted
ALTER TABLE public.submissions 
ADD CONSTRAINT submissions_form_id_fkey 
FOREIGN KEY (form_id) 
REFERENCES public.forms(id) 
ON DELETE SET NULL;  -- Set form_id to NULL instead of deleting the submission

-- Add a comment to document this behavior
COMMENT ON CONSTRAINT submissions_form_id_fkey ON public.submissions IS 
'Foreign key that preserves submission data when forms are deleted by setting form_id to NULL';