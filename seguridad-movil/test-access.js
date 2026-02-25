const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSystem() {
    console.log('=== 1. CHECKING ADMINS (READ) ===');
    const { data: admins, error: adminError } = await supabase.from('admins').select('email, companyName');
    if (adminError) console.error("Admin Read Error:", adminError);
    else console.log(`Found ${admins.length} admins. Sample:`, admins[0]);

    console.log('\n=== 2. CHECKING CAMERAS (READ) ===');
    const { data: cameras, error: camReadError } = await supabase.from('cameras').select('*');
    if (camReadError) console.error("Camera Read Error:", camReadError);
    else console.log(`Found ${cameras.length} cameras.`);

    console.log('\n=== 3. CHECKING CAMERAS (WRITE) ===');
    const testCamera = {
        id: `TEST-${Date.now()}`,
        ip: '192.168.1.99',
        marca: 'TestBot',
        modelo: 'Verifier 3000',
        activa: true,
        area: 'Testing Zone',
        alertas: 0
    };

    const { data: newCam, error: camWriteError } = await supabase.from('cameras').insert([testCamera]).select();

    if (camWriteError) {
        console.error("Camera Write Error:", camWriteError);
    } else {
        console.log("Camera created successfully:", newCam);

        // Clean up
        const { error: deleteError } = await supabase.from('cameras').delete().eq('id', testCamera.id);
        if (deleteError) console.error("Cleanup Error:", deleteError);
        else console.log("Test camera deleted.");
    }
}

testSystem();
