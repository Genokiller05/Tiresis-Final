-- Forzar eliminación de restricción NOT NULL en site_id
-- Sin condiciones, para asegurar que se ejecute.
ALTER TABLE public.reports
ALTER COLUMN "site_id" DROP NOT NULL;
NOTIFY pgrst,
'reload schema';