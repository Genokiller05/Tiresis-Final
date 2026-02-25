const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('reports').insert([{
        fechaHora: new Date().toISOString(),
        tipo: 'TEST_VERIF',
        detalles: {}
    }]).select();

    if (error) {
        // Log short error code
        console.log("RESULT: FAIL");
        console.log("MSG: " + error.message);
    } else {
        console.log("RESULT: SUCCESS");
        if (data && data.length > 0) {
            await supabase.from('reports').delete().eq('id', data[0].id);
        }
    }
}
check();
