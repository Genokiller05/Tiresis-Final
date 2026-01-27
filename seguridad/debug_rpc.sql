-- RPC DEBUG & CACHE FORCE
-- Run this in Supabase SQL Editor
-- 1. Create a function to list tables (Bypasses API cache logic)
CREATE OR REPLACE FUNCTION get_all_tables() RETURNS text [] LANGUAGE sql SECURITY DEFINER AS $$
SELECT array_agg(tablename::text)
FROM pg_tables
WHERE schemaname = 'public';
$$;
-- 2. Force a schema cache reload by altering a comment (This often wakes up PostgREST)
COMMENT ON TABLE public.admins IS 'Cache Force Reload';
COMMENT ON TABLE public.guards IS 'Cache Force Reload Guards';
-- 3. Explicit Notify
NOTIFY pgrst,
'reload schema';
-- 4. Re-Grant just in case
GRANT ALL ON TABLE public.admins TO anon,
    authenticated,
    service_role;
GRANT ALL ON TABLE public.guards TO anon,
    authenticated,
    service_role;