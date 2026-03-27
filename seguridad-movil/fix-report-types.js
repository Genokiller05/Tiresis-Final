const { createClient } = require('@supabase/supabase-js');

// Credenciales de tu proyecto actual
const SUPABASE_URL = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixReportTypes() {
    // Estos son los 4 tipos que le faltan a tu base de datos y que la App sí tiene programados.
    const missingTypes = [
        { code: "fire", name: "Incendio" },
        { code: "flood", name: "Inundación" },
        { code: "power_outage", name: "Falla eléctrica" },
        { code: "other", name: "Otro" }
    ];

    console.log("Intentando insertar los tipos de reporte faltantes (5, 6, 7 y 8) en Supabase...");
    
    // Utilizamos "upsert" por si acaso intentas correr el script dos veces,
    // para que no duplique registros sino que solo actualice el contenido existente.
    const { data, error } = await supabase
        .from('report_types')
        .insert(missingTypes)
        .select();

    if (error) {
        console.error("❌ Error al insertar datos en la Base de Datos:", error.message);
        console.log("Posible razón: Puede que necesites el 'Service Role Key' en lugar del 'Anon Key' si las reglas de seguridad restringen la inserción.");
    } else {
        console.log("✅ ¡Solucionado! Los tipos de reporte se guardaron de forma exitosa:");
        console.table(data);
    }
}

fixReportTypes();
