const { createClient } = require('@supabase/supabase-js');
// require('react-native-url-polyfill/auto');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listData() {
    console.log('=== LISTING ADMINS ===');
    const { data: admins, error: adminError } = await supabase.from('admins').select('*');
    if (adminError) console.error(adminError);
    else console.log(admins);

    console.log('\n=== LISTING CAMERAS ===');
    const { data: cameras, error: cameraError } = await supabase.from('cameras').select('*');
    if (cameraError) console.error(cameraError);
    else console.log(cameras);
}

listData();
