const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://mhzhorkprnwfbfgmrqaa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos'
);

async function checkOldSchema() {
    console.log("Testing insert with OLD schema...");

    // Old schema structure based on corrected_reports_schema.sql
    const oldReport = {
        fechaHora: new Date().toISOString(),
        tipo: 'Prueba',
        origen: 'Script',
        sitioArea: 'Area prueba',
        estado: 'Pendiente',
        detalles: { note: 'Checking schema' }
    };

    const { data, error } = await supabase.from('reports').insert([oldReport]).select();

    if (error) {
        console.log("Insert failed:", error.message);
    } else {
        console.log("Insert SUCCESS with OLD schema:", data);
    }
}

checkOldSchema();
