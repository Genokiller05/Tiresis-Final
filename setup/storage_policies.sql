-- Ejecutar esto en el SQL Editor de Supabase Dashboard
-- Esto permite que cualquier usuario (incluido el servidor backend) pueda subir y leer fotos del bucket guard-photos
-- Permitir subir archivos al bucket guard-photos
CREATE POLICY "Allow public uploads to guard-photos" ON storage.objects FOR
INSERT TO anon,
    authenticated WITH CHECK (bucket_id = 'guard-photos');
-- Permitir actualizar/reemplazar archivos en guard-photos
CREATE POLICY "Allow public updates to guard-photos" ON storage.objects FOR
UPDATE TO anon,
    authenticated USING (bucket_id = 'guard-photos') WITH CHECK (bucket_id = 'guard-photos');
-- Permitir leer archivos del bucket guard-photos (necesario para URL pública)
CREATE POLICY "Allow public reads from guard-photos" ON storage.objects FOR
SELECT TO anon,
    authenticated USING (bucket_id = 'guard-photos');
-- Permitir borrar archivos del bucket guard-photos
CREATE POLICY "Allow public deletes from guard-photos" ON storage.objects FOR DELETE TO anon,
authenticated USING (bucket_id = 'guard-photos');