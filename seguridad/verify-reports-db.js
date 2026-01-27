const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyReports() {
    console.log('--- Verificando Tabla reports (Directo a DB) ---');

    const testReport = {
        fechaHora: new Date().toISOString(),
        tipo: "Prueba de Verificación Directa",
        origen: "Script de Test",
        sitioArea: "Zona de Test Check",
        estado: "Pendiente",
        detalles: {
            descripcion: "Verificando persistencia de JSONB detalles.",
            evidencia: null,
            resumen: "Prueba directa"
        }
    };

    console.log('Intentando insertar:', testReport);

    const { data, error } = await supabase
        .from('reports')
        .insert([testReport])
        .select()
        .single();

    if (error) {
        console.error('❌ Error al insertar reporte:', error.message);
        return;
    }

    console.log('✅ Inserción exitosa:', data);

    // Verificación de campos
    if (data.detalles && data.detalles.descripcion === testReport.detalles.descripcion) {
        console.log('✅ Columna "detalles" verificada correctamente.');
    } else {
        console.error('❌ El campo "detalles" no se guardó correctamente.');
    }

    // Limpieza (Opcional)
    // await supabase.from('reports').delete().eq('id', data.id);
}

verifyReports();
