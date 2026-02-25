const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySiteId() {
    console.log("--- Verificando constraint de 'site_id' ---");

    // Consulta a information_schema para ver si es nullable
    // Nota: RPC es ideal, pero intentaremos una inserción dummy sin site_id para probar.

    const dummy = {
        fechaHora: new Date().toISOString(),
        tipo: 'Test Verification',
        origen: 'System Check',
        sitioArea: 'Verification',
        estado: 'Pendiente',
        detalles: { note: 'Auto-verification' }
        // site_id OMITIDO intencionalmente
    };

    const { data, error } = await supabase.from('reports').insert([dummy]).select();

    if (error) {
        console.error("❌ FAILED: La inserción falló:", error.message);
        if (error.message.includes('site_id')) {
            console.error("CONFIRMADO: site_id sigue siendo obligatorio.");
        }
    } else {
        console.log("✅ SUCCESS: Inserción exitosa sin 'site_id'. El fix funcionó.");
        // Limpiar el dummy
        if (data && data[0] && data[0].id) {
            await supabase.from('reports').delete().eq('id', data[0].id);
            console.log("Cleaned up test record.");
        }
    }
}

verifySiteId();
