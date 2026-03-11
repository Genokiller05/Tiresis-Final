// Script para crear el bucket 'guard-photos' en Supabase Storage
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aGxicGFhYnlmb29tbmxra3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjU3MjAsImV4cCI6MjA4NDU0MTcyMH0.0E6oNSpArkYOsdxiGiSYAWmCyQxSkHWQ8DjXuBcTVZU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
    console.log('Creando bucket guard-photos...');

    const { data, error } = await supabase.storage.createBucket('guard-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('✅ El bucket guard-photos ya existe.');
        } else {
            console.error('❌ Error creando bucket:', error.message);
        }
    } else {
        console.log('✅ Bucket guard-photos creado exitosamente:', data);
    }
}

createBucket();
