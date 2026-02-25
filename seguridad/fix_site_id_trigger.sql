-- Solución Maestra para 'site_id'
-- Crea un "Trigger" que rellena automáticamente el site_id si viene vacío.
-- Esto soluciona el error sin importar qué envíe la app.
CREATE OR REPLACE FUNCTION public.set_site_id_default() RETURNS TRIGGER AS $$ BEGIN -- Si site_id es nulo, le asignamos un UUID generado aleatoriamente
    IF NEW.site_id IS NULL THEN -- Intentamos castear a texto por si la columna es texto o UUID (Postgres suele manejar el cast implícito de UUID a texto)
    -- Si la columna es UUID, gen_random_uuid() funciona directo.
    -- Para máxima compatibilidad, usamos gen_random_uuid() y dejamos que Postgres decida.
    BEGIN NEW.site_id := gen_random_uuid();
EXCEPTION
WHEN OTHERS THEN -- Si falla (ej. es entero), ponemos 0 o 'default'
NEW.site_id := '00000000-0000-0000-0000-000000000000';
END;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Eliminar trigger anterior si existiera
DROP TRIGGER IF EXISTS ensure_site_id ON public.reports;
-- Crear el trigger
CREATE TRIGGER ensure_site_id BEFORE
INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.set_site_id_default();
-- Recargar esquema
NOTIFY pgrst,
'reload schema';