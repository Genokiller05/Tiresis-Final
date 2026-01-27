const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (mismos valores que server.js)
const supabaseUrl = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyEntriesExits() {
    console.log('--- Verificando Tabla entries_exits ---');

    // 1. Intentar insertar un registro con 'detalles'
    const testEntry = {
        tipo: 'TestEntrada',
        descripcion: 'Prueba de script de verificación',
        detalles: {
            evidence_url: 'https://example.com/fake-evidence.jpg',
            notes: 'Verificando columna JSONB'
        }
    };

    console.log('Intentando insertar:', testEntry);

    const { data, error } = await supabase
        .from('entries_exits')
        .insert([testEntry])
        .select()
        .single();

    if (error) {
        console.error('❌ Error al insertar:', error.message);
        if (error.message.includes('column "detalles" of relation "entries_exits" does not exist')) {
            console.error('⚠️  LA COLUMNA "detalles" NO EXISTE. Debes ejecutar el script SQL.');
        }
        return;
    }

    console.log('✅ Inserción exitosa:', data);

    // 2. Verificar que se guardó el detalle
    if (data.detalles && data.detalles.evidence_url === testEntry.detalles.evidence_url) {
        console.log('✅ Columna "detalles" verificada correctamente.');
    } else {
        console.error('❌ El campo "detalles" no se guardó o recuperó correctamente.');
    }

    // Limpieza (Opcional, dejarlo para ver en dashboard)
    // await supabase.from('entries_exits').delete().eq('id', data.id);
}

verifyEntriesExits();
