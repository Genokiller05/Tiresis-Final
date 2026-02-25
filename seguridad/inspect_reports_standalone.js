const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log("--- Inspeccionando tabla 'reports' ---");

    // Select * limit 1 to see columns
    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error al hacer select *:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Columnas actuales:", Object.keys(data[0]));
        } else {
            console.log("Tabla vacía, intentando insert dummy para detectar columnas faltantes...");
            // Try to insert a row with all expected columns to see what fails
            const dummy = {
                fechaHora: new Date().toISOString(),
                tipo: 'Test',
                origen: 'Test',
                sitioArea: 'Test',
                estado: 'Pendiente',
                detalles: {}
            };
            const { error: insertError } = await supabase.from('reports').insert([dummy]);
            if (insertError) {
                console.error("Error al insertar dummy:", insertError.message);
            } else {
                console.log("Insert dummy exitoso! La tabla tiene las columnas.");
            }
        }
    }
}

inspectTable();
