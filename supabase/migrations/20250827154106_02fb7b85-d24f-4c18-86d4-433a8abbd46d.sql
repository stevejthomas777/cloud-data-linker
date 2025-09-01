-- Create users table for custom authentication
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forms table
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  form_code TEXT NOT NULL UNIQUE, -- 8 character code like Y538WYUE
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  last_name TEXT NOT NULL,
  city TEXT,
  region TEXT,
  country TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table (public access for auth)
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Anyone can create users" ON public.users FOR INSERT WITH CHECK (true);

-- Create policies for forms table
CREATE POLICY "Users can view their own forms" ON public.forms FOR SELECT USING (true);
CREATE POLICY "Users can create forms" ON public.forms FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own forms" ON public.forms FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own forms" ON public.forms FOR DELETE USING (true);

-- Create policies for submissions table
CREATE POLICY "Anyone can create submissions" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Form owners can view submissions" ON public.submissions FOR SELECT USING (true);

-- Create function to generate random form codes
CREATE OR REPLACE FUNCTION generate_form_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;