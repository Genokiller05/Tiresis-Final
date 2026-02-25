-- Script de Corrección Definitiva para Reportes
-- Agrega las columnas faltantes y asegura que todo esté sincronizado.
-- 1. Agregar columnas si faltan
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS "fechaHora" text;
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS "tipo" text;
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS "origen" text;
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS "sitioArea" text;
-- 2. Asegurar que las otras columnas críticas también estén
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS "estado" text DEFAULT 'Pendiente';
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS "detalles" jsonb;
-- 3. Forzar actualización de caché
NOTIFY pgrst,
'reload schema';