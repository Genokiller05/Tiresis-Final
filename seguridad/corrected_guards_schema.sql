-- 1. Limpiar tabla guards (¡CUIDADO! ESTO BORRA DATOS)
DROP TABLE IF EXISTS guards;
-- 2. Crear tabla guards compatible con la aplicación
CREATE TABLE public.guards (
    "idEmpleado" text PRIMARY KEY,
    "nombre" text NOT NULL,
    "email" text,
    "telefono" text,
    "direccion" text,
    "foto" text,
    "area" text,
    -- Agregado: Requerido por el frontend (HomeComponent)
    "estado" text DEFAULT 'Fuera de servicio',
    -- Agregado: Requerido para ver estado en mapa
    "lat" float8,
    -- Agregado: Requerido para posicionar en el mapa
    "lng" float8,
    -- Agregado: Requerido para posicionar en el mapa
    "fechaContratacion" timestamp with time zone DEFAULT now()
);
-- 3. Dar permisos (CRÍTICO - Solo para Desarrollo Rápido)
GRANT ALL ON TABLE public.guards TO anon,
    authenticated,
    service_role;
-- 4. Actualizar API
NOTIFY pgrst,
'reload schema';