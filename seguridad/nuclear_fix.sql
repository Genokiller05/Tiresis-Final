-- NUCLEAR FIX - DROP AND RECREATE
-- This will delete existing data in these tables, but we have backups in JSON.
-- Run this in Supabase SQL Editor.
-- 1. DROP TABLES (Force schema change)
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.guards CASCADE;
-- 2. RECREATE ADMINS
CREATE TABLE public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "fullName" TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    "companyName" TEXT,
    location TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    zone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 3. RECREATE GUARDS
CREATE TABLE public.guards (
    "idEmpleado" TEXT PRIMARY KEY,
    nombre TEXT,
    email TEXT,
    area TEXT,
    estado TEXT,
    actividades JSONB DEFAULT '[]'::jsonb,
    direccion TEXT,
    telefono TEXT,
    foto TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    "fechaContratacion" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 4. PERMISSIONS (ADMINS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.admins TO anon;
GRANT ALL ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;
CREATE POLICY "Admins select policy" ON public.admins FOR
SELECT TO anon USING (true);
CREATE POLICY "Admins insert policy" ON public.admins FOR
INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admins update policy" ON public.admins FOR
UPDATE TO anon USING (true);
-- 5. PERMISSIONS (GUARDS)
ALTER TABLE public.guards ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.guards TO anon;
GRANT ALL ON public.guards TO authenticated;
GRANT ALL ON public.guards TO service_role;
CREATE POLICY "Guards select policy" ON public.guards FOR
SELECT TO anon USING (true);
CREATE POLICY "Guards modification policy" ON public.guards FOR ALL TO anon USING (true);
-- 6. CACHE RELOAD
NOTIFY pgrst,
'reload schema';