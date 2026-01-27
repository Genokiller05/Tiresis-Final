-- ==========================================
-- SCRIPT DE REPARACIÓN COMPLETA DE BASE DE DATOS (CON PERMISOS EXPLICITOS)
-- ==========================================
-- 1. RECARGAR CACHÉ DE ESQUEMA
NOTIFY pgrst,
'reload schema';
-- 2. TABLA ADMINS
CREATE TABLE IF NOT EXISTS public.admins (
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
-- Asegurar permisos RLS y GRANT para admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
-- PERMISOS CLAVE QUE FALTABAN:
GRANT ALL ON public.admins TO anon;
GRANT ALL ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;
DROP POLICY IF EXISTS "Admins select policy" ON public.admins;
CREATE POLICY "Admins select policy" ON public.admins FOR
SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Admins insert policy" ON public.admins;
CREATE POLICY "Admins insert policy" ON public.admins FOR
INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Admins update policy" ON public.admins;
CREATE POLICY "Admins update policy" ON public.admins FOR
UPDATE TO anon USING (true);
-- 3. TABLA GUARDS
CREATE TABLE IF NOT EXISTS public.guards (
    "idEmpleado" TEXT PRIMARY KEY,
    nombre TEXT,
    email TEXT,
    area TEXT,
    estado TEXT,
    actividades JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Añadir columnas si no existen
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guards'
        AND column_name = 'direccion'
) THEN
ALTER TABLE public.guards
ADD COLUMN direccion TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guards'
        AND column_name = 'telefono'
) THEN
ALTER TABLE public.guards
ADD COLUMN telefono TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guards'
        AND column_name = 'foto'
) THEN
ALTER TABLE public.guards
ADD COLUMN foto TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guards'
        AND column_name = 'lat'
) THEN
ALTER TABLE public.guards
ADD COLUMN lat DOUBLE PRECISION;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guards'
        AND column_name = 'lng'
) THEN
ALTER TABLE public.guards
ADD COLUMN lng DOUBLE PRECISION;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guards'
        AND column_name = 'fechaContratacion'
) THEN
ALTER TABLE public.guards
ADD COLUMN "fechaContratacion" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END IF;
END $$;
-- Asegurar permisos RLS y GRANT para guards
ALTER TABLE public.guards ENABLE ROW LEVEL SECURITY;
-- PERMISOS CLAVE QUE FALTABAN:
GRANT ALL ON public.guards TO anon;
GRANT ALL ON public.guards TO authenticated;
GRANT ALL ON public.guards TO service_role;
DROP POLICY IF EXISTS "Guards select policy" ON public.guards;
CREATE POLICY "Guards select policy" ON public.guards FOR
SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Guards modification policy" ON public.guards;
CREATE POLICY "Guards modification policy" ON public.guards FOR ALL TO anon USING (true);
-- 4. INSERTAR DATOS POR DEFECTO
INSERT INTO public.admins (email, password, "fullName", "companyName")
VALUES (
        'admin@tiresis.com',
        'admin123',
        'Admin Principal',
        'Tiresis HQ'
    ) ON CONFLICT (email) DO NOTHING;
INSERT INTO public.guards ("idEmpleado", nombre, email, "area", "estado")
VALUES (
        'TEST-001',
        'Guardia Prueba',
        'guardia@tiresis.com',
        'Entrada',
        'En servicio'
    ) ON CONFLICT ("idEmpleado") DO
UPDATE
SET email = 'guardia@tiresis.com';
-- 5. RECARGAR CACHÉ FINAL
NOTIFY pgrst,
'reload schema';