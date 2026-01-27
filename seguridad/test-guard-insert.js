const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testGuardInsert() {
    console.log("Testing Guard Insert...");

    const testGuard = {
        idEmpleado: `TEST_${Date.now()}`,
        nombre: "Test Guard",
        email: `guard_${Date.now()}@test.com`,
        telefono: "555-123-4567",
        direccion: "Unknown St",
        fechaContratacion: new Date().toISOString()
    };

    console.log("Payload:", testGuard);

    const { data, error } = await supabase
        .from('guards')
        .insert([testGuard])
        .select();

    if (error) {
        console.error("❌ Guard Insert Failed:", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Guard Insert Success:", data);
        // cleanup
        await supabase.from('guards').delete().eq('idEmpleado', testGuard.idEmpleado);
    }
}

testGuardInsert();
