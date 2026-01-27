-- Create table for entries/exits if it doesn't exist
CREATE TABLE IF NOT EXISTS public.entries_exits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fechaHora" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipo TEXT NOT NULL,
    -- 'Entrada' or 'Salida'
    descripcion TEXT,
    detalles JSONB DEFAULT '{}'::jsonb,
    -- Flexible field for evidence, structured description, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.entries_exits ENABLE ROW LEVEL SECURITY;
-- Policy to allow anonymous insert (for now, as per user requirement)
CREATE POLICY "Allow anonymous insert" ON public.entries_exits FOR
INSERT TO anon WITH CHECK (true);
-- Policy to allow anonymous select
CREATE POLICY "Allow anonymous select" ON public.entries_exits FOR
SELECT TO anon USING (true);
-- Policy to allow anonymous update
CREATE POLICY "Allow anonymous update" ON public.entries_exits FOR
UPDATE TO anon USING (true);
-- Policy to allow anonymous delete
CREATE POLICY "Allow anonymous delete" ON public.entries_exits FOR DELETE TO anon USING (true);