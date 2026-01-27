const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    console.log("--- Verificando columna 'detalles' ---");

    // Attempt to select the specific column
    const { data, error } = await supabase
        .from('reports')
        .select('detalles')
        .limit(1);

    if (error) {
        console.error("❌ Error al seleccionar 'detalles':", error.message);
        console.error("Details:", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Columna 'detalles' seleccionable.");
    }
}

checkColumn();
