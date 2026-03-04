-- =============================================
-- TIRESIS - Asignar datos existentes a un admin por defecto
-- 
-- INSTRUCCIONES:
-- 1. Primero, busca el ID de tu admin principal en la tabla 'admins':
--    SELECT id, email, "fullName" FROM public.admins;
--
-- 2. Copia el ID del admin al que quieres asignar los datos existentes
--
-- 3. Reemplaza 'TU_ADMIN_ID_AQUI' con ese ID en todas las líneas abajo
--
-- 4. Ejecuta este script en Supabase Dashboard → SQL Editor
-- =============================================

-- Reemplaza este valor con el ID real de tu admin
DO $$
DECLARE
  default_admin_id TEXT := 'TU_ADMIN_ID_AQUI';  -- ← CAMBIAR ESTO
BEGIN

  -- Asignar guardias sin admin_id al admin por defecto
  UPDATE public.guards 
  SET admin_id = default_admin_id 
  WHERE admin_id = '' OR admin_id IS NULL;
  RAISE NOTICE 'Guards actualizados: %', (SELECT COUNT(*) FROM public.guards WHERE admin_id = default_admin_id);

  -- Asignar cámaras sin admin_id al admin por defecto
  UPDATE public.cameras 
  SET admin_id = default_admin_id 
  WHERE admin_id = '' OR admin_id IS NULL;
  RAISE NOTICE 'Cameras actualizadas: %', (SELECT COUNT(*) FROM public.cameras WHERE admin_id = default_admin_id);

  -- Asignar reportes sin admin_id al admin por defecto
  UPDATE public.reports 
  SET admin_id = default_admin_id 
  WHERE admin_id = '' OR admin_id IS NULL;
  RAISE NOTICE 'Reports actualizados: %', (SELECT COUNT(*) FROM public.reports WHERE admin_id = default_admin_id);

  -- Asignar edificios sin admin_id al admin por defecto
  UPDATE public.buildings 
  SET admin_id = default_admin_id 
  WHERE admin_id = '' OR admin_id IS NULL;
  RAISE NOTICE 'Buildings actualizados: %', (SELECT COUNT(*) FROM public.buildings WHERE admin_id = default_admin_id);

  -- Asignar entradas/salidas sin admin_id al admin por defecto
  UPDATE public.entries_exits 
  SET admin_id = default_admin_id 
  WHERE admin_id = '' OR admin_id IS NULL;
  RAISE NOTICE 'Entries_exits actualizados: %', (SELECT COUNT(*) FROM public.entries_exits WHERE admin_id = default_admin_id);

  RAISE NOTICE '✅ Migración completada. Todos los registros huérfanos ahora pertenecen al admin: %', default_admin_id;

END $$;
