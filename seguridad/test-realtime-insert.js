const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsertReport() {
    console.log("Simulando creación de reporte desde app móvil...");

    // Create dummy report record simulating mobile insert
    const fakeReport = {
        site_id: "29e48d60-df1e-4b7c-91dc-184ca1ea2c3e", // Ensure exists
        report_type_id: 1, // Incidente
        status_id: 1, // Pendiente
        priority_id: 2,
        short_description: "TEST REALTIME: Puerta dañada detectada a las " + new Date().toLocaleTimeString(),
        created_by_guard_id: "a7fc32c3-56f5-4d68-ba57-43b5a2f17dd9",
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('reports')
        .insert(fakeReport)
        .select()
        .single();

    if (error) {
        console.error("❌ Error simulando reporte:", error.message);
    } else {
        console.log("✅ Reporte insertado correctamente. ¡El portal web de Angular (Alertas) debería parpadear y mostrarlo!");
        console.log(data);
    }
}

testInsertReport();
