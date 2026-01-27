-- EMERGENCY FIX SCRIPT
-- Run this entire script in the Supabase SQL Editor
-- 1. Reload Schema Cache first
NOTIFY pgrst,
'reload schema';
-- 2. Grants for Admins (Run blindly)
GRANT ALL ON TABLE public.admins TO anon;
GRANT ALL ON TABLE public.admins TO authenticated;
GRANT ALL ON TABLE public.admins TO service_role;
-- 3. Add missing columns to Guards (Ignore errors if they exist)
ALTER TABLE public.guards
ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE public.guards
ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE public.guards
ADD COLUMN IF NOT EXISTS foto text;
ALTER TABLE public.guards
ADD COLUMN IF NOT EXISTS lat float;
ALTER TABLE public.guards
ADD COLUMN IF NOT EXISTS lng float;
ALTER TABLE public.guards
ADD COLUMN IF NOT EXISTS "fechaContratacion" timestamp with time zone DEFAULT now();
-- 4. Grants for Guards
GRANT ALL ON TABLE public.guards TO anon;
GRANT ALL ON TABLE public.guards TO authenticated;
GRANT ALL ON TABLE public.guards TO service_role;
-- 5. Reload Schema Cache last
NOTIFY pgrst,
'reload schema';