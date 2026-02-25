-- Corregir error de constraint 'site_id' y asegurar integridad
-- 1. Hacer 'site_id' opcional (nullable) para evitar el error de inserción
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'reports'
        AND column_name = 'site_id'
) THEN
ALTER TABLE public.reports
ALTER COLUMN "site_id" DROP NOT NULL;
END IF;
END $$;
-- 2. Asegurar (nuevamente) que las columnas críticas existan (por si acaso)
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS "fechaHora" text;
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS "detalles" jsonb;
-- 3. Forzar recarga de esquema
NOTIFY pgrst,
'reload schema';