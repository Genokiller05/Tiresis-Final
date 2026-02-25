const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyColumns() {
    console.log("--- Verificando columnas críticas en 'reports' ---");

    // Intentamos seleccionar las columnas específicas
    const { data, error } = await supabase
        .from('reports')
        .select('fechaHora, tipo, origen, sitioArea, estado, detalles')
        .limit(1);

    if (error) {
        console.error("❌ FAILED: Error al seleccionar columnas:", error.message);
        process.exit(1);
    } else {
        console.log("✅ SUCCESS: Todas las columnas críticas existen y son accesibles.");
        if (data.length > 0) {
            console.log("Datos de muestra:", data[0]);
        } else {
            console.log("La tabla está vacía, pero la estructura es correcta.");
        }
    }
}

verifyColumns();
