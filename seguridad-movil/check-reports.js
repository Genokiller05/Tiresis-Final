const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const newReport = {
        fechaHora: new Date().toISOString(),
        tipo: 'Test',
        origen: 'Guardia',
        sitioArea: 'Patrullaje',
        estado: 'Pendiente',
        detalles: { descripcion: 'test' }
    };
    const response = await supabase.from('reports').insert([newReport]).select();
    console.log('Result:', response.error ? response.error : 'Success!');
}
check();
