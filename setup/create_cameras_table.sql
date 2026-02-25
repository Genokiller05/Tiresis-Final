-- Create the cameras table
CREATE TABLE IF NOT EXISTS cameras (
    id text PRIMARY KEY,
    ip text,
    marca text,
    modelo text,
    activa boolean DEFAULT true,
    area text,
    alertas integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
-- Enable RLS
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
-- Allow Public Access (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Public Access Cameras" ON cameras;
CREATE POLICY "Public Access Cameras" ON cameras FOR ALL USING (true) WITH CHECK (true);