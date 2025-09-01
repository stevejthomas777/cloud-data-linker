-- Check the current foreign key constraint on submissions table
-- and modify it to prevent cascading deletes

-- First, let's see what constraints exist
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    confdeltype as delete_action
FROM pg_constraint 
WHERE contype = 'f' 
AND conrelid = 'public.submissions'::regclass;