-- Enable RLS (Row Level Security) on all tables (if not already)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries_exits ENABLE ROW LEVEL SECURITY;
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access Admins" ON admins;
DROP POLICY IF EXISTS "Public Access Guards" ON guards;
DROP POLICY IF EXISTS "Public Access Cameras" ON cameras;
DROP POLICY IF EXISTS "Public Access Reports" ON reports;
DROP POLICY IF EXISTS "Public Access Buildings" ON buildings;
DROP POLICY IF EXISTS "Public Access EntriesExits" ON entries_exits;
-- Create Permissive Policies (SELECT, INSERT, UPDATE, DELETE) for Anon Key
-- CAUTION: This makes data public via API Key. Ensure this is intended for this dev stage.
CREATE POLICY "Public Access Admins" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Guards" ON guards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Cameras" ON cameras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Reports" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Buildings" ON buildings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access EntriesExits" ON entries_exits FOR ALL USING (true) WITH CHECK (true);