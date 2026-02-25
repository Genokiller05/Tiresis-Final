-- 1. Drop the problematic Foreign Key Constraint
-- This constraint expects a UUID pointing to auth.users (probably), preventing us from storing idEmpleado (text)
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_created_by_guard_id_fkey;
-- 2. Change the column type to TEXT to allow 'idEmpleado'
ALTER TABLE reports
ALTER COLUMN created_by_guard_id TYPE text;
-- 3. Create 'evidence' Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true) ON CONFLICT (id) DO NOTHING;
-- 4. Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR
SELECT USING (bucket_id = 'evidence');
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects FOR
INSERT WITH CHECK (bucket_id = 'evidence');