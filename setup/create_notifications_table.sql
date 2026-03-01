-- =============================================
-- TIRESIS - Tabla de Notificaciones para Guardias
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.guard_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id text NOT NULL,                          -- idEmpleado del guardia
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'general'             -- area_change, shift_start, shift_end, general
    CHECK (type IN ('area_change', 'shift_start', 'shift_end', 'general')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_guard_notifications_guard ON public.guard_notifications(guard_id);
CREATE INDEX IF NOT EXISTS idx_guard_notifications_read ON public.guard_notifications(guard_id, is_read);
CREATE INDEX IF NOT EXISTS idx_guard_notifications_created ON public.guard_notifications(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.guard_notifications ENABLE ROW LEVEL SECURITY;

-- Política: los guardias autenticados pueden leer sus propias notificaciones
CREATE POLICY "guard_notifications_select" ON public.guard_notifications
  FOR SELECT USING (true);  -- Permitir lectura (se filtra por guard_id en la app)

CREATE POLICY "guard_notifications_update" ON public.guard_notifications
  FOR UPDATE USING (true);  -- Permitir marcar como leída

CREATE POLICY "guard_notifications_insert" ON public.guard_notifications
  FOR INSERT WITH CHECK (true);  -- Permitir crear (desde el panel admin/backend)

-- Habilitar Realtime para esta tabla
ALTER PUBLICATION supabase_realtime ADD TABLE public.guard_notifications;

-- =============================================
-- Datos de prueba (opcional - cambiar guard_id por uno real)
-- =============================================
-- INSERT INTO public.guard_notifications (guard_id, title, body, type)
-- VALUES
--   ('00012345', 'Inicio de Jornada', 'Tu turno ha comenzado. Área asignada: Entrada Principal.', 'shift_start'),
--   ('00012345', 'Cambio de Área', 'Has sido reasignado al Estacionamiento B.', 'area_change'),
--   ('00012345', 'Fin de Jornada', 'Tu turno ha finalizado. ¡Buen trabajo!', 'shift_end');
