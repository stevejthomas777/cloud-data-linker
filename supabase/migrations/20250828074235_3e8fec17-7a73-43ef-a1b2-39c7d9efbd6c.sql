-- Fix function search path issues for security
ALTER FUNCTION public.set_submission_user_id() SET search_path = public;
ALTER FUNCTION public.get_current_user_id() SET search_path = public;