const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateInsert() {
    console.log("Simulating POST /api/cameras insert...");

    // Payload similar to what frontend sends
    const mockBody = {
        id: `CAM-DEBUG-${Date.now()}`,
        ip: "192.168.1.55",
        marca: "DebugBrand",
        modelo: "DebugModel",
        area: "DebugArea",
        activa: true,
        alertas: 0
    };

    console.log("Payload:", mockBody);

    const { data, error } = await supabase.from('cameras').insert([mockBody]);

    if (error) {
        console.error("❌ INSERT FAILED:", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ INSERT SUCCESS. Record created.");

        // Cleanup
        await supabase.from('cameras').delete().eq('id', mockBody.id);
    }
}

simulateInsert();
