-- ==========================================
-- SCRIPT DE CORRECCIÓN DE LOGIN Y PERMISOS
-- ==========================================
-- 1. CORRECCIÓN DE LA TABLA ADMINS
-- Habilitar RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
-- Crear política para permitir que la API (con llave anónima) lea los admins para el login
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admins;
CREATE POLICY "Enable read access for all users" ON public.admins FOR
SELECT TO anon USING (true);
-- Crear política para permitir inserción (registro)
DROP POLICY IF EXISTS "Enable insert for all users" ON public.admins;
CREATE POLICY "Enable insert for all users" ON public.admins FOR
INSERT TO anon WITH CHECK (true);
-- Crear política para permitir actualización
DROP POLICY IF EXISTS "Enable update for all users" ON public.admins;
CREATE POLICY "Enable update for all users" ON public.admins FOR
UPDATE TO anon USING (true);
-- 2. CORRECCIÓN DE LA TABLA GUARDS
-- Habilitar RLS
ALTER TABLE public.guards ENABLE ROW LEVEL SECURITY;
-- Crear política para permitir lectura (Login móvil)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.guards;
CREATE POLICY "Enable read access for all users" ON public.guards FOR
SELECT TO anon USING (true);
-- Crear política para permitir inserción/actualización (Gestión de guardias)
DROP POLICY IF EXISTS "Enable modification for all users" ON public.guards;
CREATE POLICY "Enable modification for all users" ON public.guards FOR ALL TO anon USING (true);
-- 3. RESTAURACIÓN DE USUARIOS POR DEFECTO (Si no existen)
-- Insertar Admin por defecto
INSERT INTO public.admins (email, password, "fullName", "companyName")
VALUES (
        'admin@tiresis.com',
        'admin123',
        'Administrador Principal',
        'Seguridad Central'
    ) ON CONFLICT (email) DO NOTHING;
-- Insertar Guardia por defecto
INSERT INTO public.guards ("idEmpleado", nombre, email, "area", "estado")
VALUES (
        'G-001',
        'Juan Perez Test',
        'guardia@tiresis.com',
        'Entrada Principal',
        'En servicio'
    ) ON CONFLICT ("idEmpleado") DO
UPDATE
SET email = 'guardia@tiresis.com';
-- Asegurar que el email sea este para probar
-- 4. Notificar recarga de caché de esquema
NOTIFY pgrst,
'reload schema';