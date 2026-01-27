const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testReportCreation() {
    console.log("--- Probando Creación de Reporte con Evidencia ---");

    const testReport = {
        fechaHora: new Date().toISOString(),
        tipo: 'Prueba Automática',
        origen: 'Guardia',
        sitioArea: 'Zona de Pruebas',
        estado: 'Pendiente',
        detalles: {
            descripcion: 'Este es un reporte de prueba generado por script.',
            evidencia: 'https://placehold.co/600x400', // Dummy URL
            resumen: 'Prueba script'
        }
    };

    // 1. Insert
    const { data, error } = await supabase
        .from('reports')
        .insert([testReport])
        .select()
        .single();

    if (error) {
        console.error("❌ Error al crear reporte:", error.message);
        console.error("Detalles:", JSON.stringify(error, null, 2));
        const fs = require('fs');
        fs.writeFileSync('c:\\sistema-de-vigilancia\\seguridad\\report_error_log.json', JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Reporte creado ID:", data.id);

        // 2. Fetch back to verify JSONB
        const { data: fetched } = await supabase
            .from('reports')
            .select('*')
            .eq('id', data.id)
            .single();

        if (fetched && fetched.detalles && fetched.detalles.evidencia) {
            console.log("✅ Evidencia guardada correctamente:", fetched.detalles.evidencia);
        } else {
            console.log("❌ La evidencia no se guardó en el JSONB.");
        }
    }
}

testReportCreation();
