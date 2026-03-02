const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsertEntry() {
    console.log("Simulando creación de entrada desde app móvil...");

    // Create dummy entry record simulating mobile insert
    const fakeEntry = {
        fechaHora: new Date().toISOString(),
        tipo: 'Entrada',
        descripcion: 'Nombre: Empleado Prueba. Trabajador: Mantenimiento - Reparación de AC',
        categoria: 'service',
        idRelacionado: null,
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('entries_exits')
        .insert(fakeEntry)
        .select()
        .single();

    if (error) {
        console.error("❌ Error simulando entrada:", error.message);
    } else {
        console.log("✅ Entrada/Salida insertada correctamente. ¡El portal web de Angular (Control de Accesos) debería mostrarlo!");
        console.log(data);
    }
}

testInsertEntry();
