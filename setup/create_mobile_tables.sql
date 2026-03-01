-- =============================================
-- TIRESIS - Tablas faltantes para la app móvil
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Tabla de sitios/edificios
CREATE TABLE IF NOT EXISTS public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  geometry jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabla de guardias
CREATE TABLE IF NOT EXISTS public.guards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "idEmpleado" text UNIQUE NOT NULL,
  nombre text NOT NULL,
  email text,
  area text,
  foto text,
  estado text DEFAULT 'En servicio',
  "fechaContratacion" text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Catálogo: Tipos de reporte
CREATE TABLE IF NOT EXISTS public.report_types (
  id serial PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE
);

INSERT INTO public.report_types (name, code) VALUES
  ('Actividad sospechosa', 'suspicious_activity'),
  ('Daño a propiedad', 'property_damage'),
  ('Emergencia médica', 'medical_emergency'),
  ('Alerta recibida', 'received_alert')
ON CONFLICT (code) DO NOTHING;

-- 4. Catálogo: Prioridades
CREATE TABLE IF NOT EXISTS public.priorities (
  id serial PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE
);

INSERT INTO public.priorities (name, code) VALUES
  ('Baja', 'low'),
  ('Media', 'medium'),
  ('Alta', 'high'),
  ('Crítica', 'critical')
ON CONFLICT (code) DO NOTHING;

-- 5. Catálogo: Estatus de reporte
CREATE TABLE IF NOT EXISTS public.report_statuses (
  id serial PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE
);

INSERT INTO public.report_statuses (name, code) VALUES
  ('Enviado', 'sent'),
  ('En Revisión', 'in_review'),
  ('Resuelto', 'resolved')
ON CONFLICT (code) DO NOTHING;

-- 6. Tabla de reportes
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.sites(id),
  shift_id text,
  report_type_id integer REFERENCES public.report_types(id),
  status_id integer REFERENCES public.report_statuses(id) DEFAULT 1,
  priority_id integer REFERENCES public.priorities(id),
  location_id text,
  gps_lat numeric,
  gps_lng numeric,
  short_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_by_guard_id uuid REFERENCES public.guards(id)
);

CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_guard ON public.reports(created_by_guard_id);

-- 7. Tabla de entradas/salidas
CREATE TABLE IF NOT EXISTS public.entries_exits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id uuid REFERENCES public.guards(id),
  visitor_name text NOT NULL,
  visitor_type text DEFAULT 'visit',  -- visit, delivery, worker
  photo_url text,
  notes text,
  entry_time timestamptz NOT NULL DEFAULT now(),
  exit_time timestamptz,
  site_id uuid REFERENCES public.sites(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Tabla de evidencias
CREATE TABLE IF NOT EXISTS public.evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_type_id integer DEFAULT 1,  -- 1 = image
  storage_path text NOT NULL,
  created_by_user_id text,
  mime_type text DEFAULT 'image/jpeg',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Tabla de relación reporte-evidencia
CREATE TABLE IF NOT EXISTS public.report_evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  evidence_id uuid REFERENCES public.evidences(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(report_id, evidence_id)
);

-- =============================================
-- Habilitar RLS en todas las tablas
-- =============================================
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries_exits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_statuses ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (lectura y escritura para todos, desde anon key)
-- Se eliminan antes de crear para evitar errores de duplicado
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'sites','guards','reports','entries_exits',
      'evidences','report_evidences','report_types',
      'priorities','report_statuses'
    ])
  LOOP
    -- Eliminar políticas existentes si hay
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
    END LOOP;
    -- Crear nuevas políticas
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', tbl || '_select', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (true)', tbl || '_insert', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (true)', tbl || '_update', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (true)', tbl || '_delete', tbl);
  END LOOP;
END $$;

-- =============================================
-- Datos de prueba (sitios)
-- =============================================
INSERT INTO public.sites (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Edificio Central'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Área Deportiva'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Entrada Principal'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Sitio General')
ON CONFLICT (id) DO NOTHING;
