const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aGxicGFhYnlmb29tbmxra3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjU3MjAsImV4cCI6MjA4NDU0MTcyMH0.0E6oNSpArkYOsdxiGiSYAWmCyQxSkHWQ8DjXuBcTVZU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function injectTypes() {
    const records = [
        { id: 5, name: 'Mantenimiento', description: 'Log de Mantenimiento' },
        { id: 6, name: 'Sospechoso', description: 'Actividad sospechosa' },
        { id: 7, name: 'Emergencia', description: 'Emergencia' },
    ];

    for (const r of records) {
        const { error } = await supabase.from('report_types').upsert(r);
        if (error) console.error("Error intertando " + r.name + ": ", error);
        else console.log("Insertado " + r.name);
    }
}
injectTypes();
