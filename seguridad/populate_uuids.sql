-- EXTREMADAMENTE IMPORTANTE: Ejecutar esto para que la App Móvil funcione
-- Esto inserta los Sitios con los ID exactos que la App usa como "fallback"
-- Y habilita permisos para que el usuario anónimo pueda reportar.

-- 1. Deshabilitar RLS temporalmente para facilitar desarrollo (Omitir en Producción)
ALTER TABLE public.sites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Insertar Sitios con IDs fijos (UUIDs)
INSERT INTO public.sites (id, name, address)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Edificio Central', 'Campus Principal'),
  ('22222222-2222-2222-2222-222222222222', 'Área Deportiva', 'Zona Sur'),
  ('33333333-3333-3333-3333-333333333333', 'Entrada Principal', 'Acceso A'),
  ('44444444-4444-4444-4444-444444444444', 'Sitio General', 'General')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Asegurar que exista un perfil para el usuario que reporta
-- (Ajustar ID si el usuario usa uno diferente real, pero esto ayuda si auth falla)
INSERT INTO public.profiles (id, full_name, document_id)
VALUES ('00000000-0000-0000-0000-000000000000', 'Guardia Default', 'D-0000')
ON CONFLICT (id) DO NOTHING;
