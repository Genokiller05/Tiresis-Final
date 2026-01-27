-- Asegurar columnas críticas en reports
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS "estado" text DEFAULT 'Pendiente';
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS "detalles" jsonb;
-- Force reload
NOTIFY pgrst,
'reload schema';