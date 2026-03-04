-- =============================================
-- TIRESIS - Migración Multi-Tenant por site_id
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =============================================

-- =============================================
-- 1) Crear tabla site_memberships
-- =============================================
CREATE TABLE IF NOT EXISTS public.site_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, site_id)
);

CREATE INDEX IF NOT EXISTS idx_site_memberships_user ON public.site_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_site_memberships_site ON public.site_memberships(site_id);
CREATE INDEX IF NOT EXISTS idx_site_memberships_active ON public.site_memberships(user_id, is_active);

ALTER TABLE public.site_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_memberships_select" ON public.site_memberships FOR SELECT USING (true);
CREATE POLICY "site_memberships_insert" ON public.site_memberships FOR INSERT WITH CHECK (true);
CREATE POLICY "site_memberships_update" ON public.site_memberships FOR UPDATE USING (true);
CREATE POLICY "site_memberships_delete" ON public.site_memberships FOR DELETE USING (true);

-- =============================================
-- 2) Insertar sitio por defecto "Default Site Migration"
-- =============================================
INSERT INTO public.sites (id, name)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Default Site Migration')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3) Agregar site_id UUID a tablas que no lo tienen
-- =============================================

-- 3a) guards: agregar site_id (NULL temporalmente)
ALTER TABLE public.guards ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id);
CREATE INDEX IF NOT EXISTS idx_guards_site_id ON public.guards(site_id);

-- 3b) cameras: agregar site_id (NULL temporalmente)
ALTER TABLE public.cameras ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id);
CREATE INDEX IF NOT EXISTS idx_cameras_site_id ON public.cameras(site_id);

-- 3c) buildings: agregar site_id (NULL temporalmente)
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id);
CREATE INDEX IF NOT EXISTS idx_buildings_site_id ON public.buildings(site_id);

-- =============================================
-- 4) Asignar el site por defecto a registros sin site_id
-- =============================================
DO $$
DECLARE
  default_site uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  valid_sites uuid[];
BEGIN
  -- Obtener lista de site_ids válidos
  SELECT ARRAY_AGG(id) INTO valid_sites FROM public.sites;

  -- guards: NULL → default site
  UPDATE public.guards SET site_id = default_site
  WHERE site_id IS NULL;

  -- cameras: NULL → default site
  UPDATE public.cameras SET site_id = default_site
  WHERE site_id IS NULL;

  -- buildings: NULL → default site
  UPDATE public.buildings SET site_id = default_site
  WHERE site_id IS NULL;

  -- reports: NULL o site_id inválido → default site
  UPDATE public.reports SET site_id = default_site
  WHERE site_id IS NULL OR site_id NOT IN (SELECT id FROM public.sites);

  -- entries_exits: NULL o site_id inválido → default site
  UPDATE public.entries_exits SET site_id = default_site
  WHERE site_id IS NULL OR site_id NOT IN (SELECT id FROM public.sites);

  RAISE NOTICE '✅ Todos los registros huérfanos asignados al site por defecto.';
END $$;

-- =============================================
-- 5) Marcar site_id como NOT NULL en las tablas nuevas
-- =============================================
ALTER TABLE public.guards ALTER COLUMN site_id SET NOT NULL;
ALTER TABLE public.cameras ALTER COLUMN site_id SET NOT NULL;
ALTER TABLE public.buildings ALTER COLUMN site_id SET NOT NULL;

-- =============================================
-- 6) Crear membership para el admin principal
--    INSTRUCCIONES: Reemplaza TU_ADMIN_ID con tu ID real
--    Puedes obtenerlo con: SELECT id, email FROM public.admins;
-- =============================================

-- DESCOMENTAR y cambiar 'TU_ADMIN_ID' por el ID real:
-- INSERT INTO public.site_memberships (user_id, site_id, role, is_active)
-- VALUES ('TU_ADMIN_ID', '00000000-0000-0000-0000-000000000001'::uuid, 'admin', true)
-- ON CONFLICT (user_id, site_id) DO NOTHING;

-- =============================================
-- 7) RLS Policies basadas en site_memberships
--    Nota: Como se usa anon key y no JWT real,
--    las policies se mantienen permisivas.
--    El filtrado real ocurre en el backend.
-- =============================================

-- Guards
DROP POLICY IF EXISTS "Public Access Guards" ON public.guards;
DROP POLICY IF EXISTS "guards_select" ON public.guards;
DROP POLICY IF EXISTS "guards_insert" ON public.guards;
DROP POLICY IF EXISTS "guards_update" ON public.guards;
DROP POLICY IF EXISTS "guards_delete" ON public.guards;

CREATE POLICY "guards_select" ON public.guards FOR SELECT USING (true);
CREATE POLICY "guards_insert" ON public.guards FOR INSERT WITH CHECK (true);
CREATE POLICY "guards_update" ON public.guards FOR UPDATE USING (true);
CREATE POLICY "guards_delete" ON public.guards FOR DELETE USING (true);

-- Cameras
DROP POLICY IF EXISTS "Public Access Cameras" ON public.cameras;
DROP POLICY IF EXISTS "cameras_select" ON public.cameras;
DROP POLICY IF EXISTS "cameras_insert" ON public.cameras;
DROP POLICY IF EXISTS "cameras_update" ON public.cameras;
DROP POLICY IF EXISTS "cameras_delete" ON public.cameras;

CREATE POLICY "cameras_select" ON public.cameras FOR SELECT USING (true);
CREATE POLICY "cameras_insert" ON public.cameras FOR INSERT WITH CHECK (true);
CREATE POLICY "cameras_update" ON public.cameras FOR UPDATE USING (true);
CREATE POLICY "cameras_delete" ON public.cameras FOR DELETE USING (true);

-- Reports
DROP POLICY IF EXISTS "Public Access Reports" ON public.reports;
DROP POLICY IF EXISTS "reports_select" ON public.reports;
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
DROP POLICY IF EXISTS "reports_update" ON public.reports;
DROP POLICY IF EXISTS "reports_delete" ON public.reports;

CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (true);
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING (true);
CREATE POLICY "reports_delete" ON public.reports FOR DELETE USING (true);

-- Buildings
DROP POLICY IF EXISTS "Public Access Buildings" ON public.buildings;
DROP POLICY IF EXISTS "buildings_select" ON public.buildings;
DROP POLICY IF EXISTS "buildings_insert" ON public.buildings;
DROP POLICY IF EXISTS "buildings_update" ON public.buildings;
DROP POLICY IF EXISTS "buildings_delete" ON public.buildings;

CREATE POLICY "buildings_select" ON public.buildings FOR SELECT USING (true);
CREATE POLICY "buildings_insert" ON public.buildings FOR INSERT WITH CHECK (true);
CREATE POLICY "buildings_update" ON public.buildings FOR UPDATE USING (true);
CREATE POLICY "buildings_delete" ON public.buildings FOR DELETE USING (true);

-- Entries/Exits
DROP POLICY IF EXISTS "Public Access EntriesExits" ON public.entries_exits;
DROP POLICY IF EXISTS "entries_exits_select" ON public.entries_exits;
DROP POLICY IF EXISTS "entries_exits_insert" ON public.entries_exits;
DROP POLICY IF EXISTS "entries_exits_update" ON public.entries_exits;
DROP POLICY IF EXISTS "entries_exits_delete" ON public.entries_exits;

CREATE POLICY "entries_exits_select" ON public.entries_exits FOR SELECT USING (true);
CREATE POLICY "entries_exits_insert" ON public.entries_exits FOR INSERT WITH CHECK (true);
CREATE POLICY "entries_exits_update" ON public.entries_exits FOR UPDATE USING (true);
CREATE POLICY "entries_exits_delete" ON public.entries_exits FOR DELETE USING (true);
