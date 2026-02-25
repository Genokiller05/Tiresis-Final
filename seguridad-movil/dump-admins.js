const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpAdmins() {
    console.log('=== DUMPING ADMINS (*) ===');
    const { data: admins, error } = await supabase.from('admins').select('*');

    if (error) {
        console.error("Error fetching admins:", error);
    } else {
        console.log("Found admins:", JSON.stringify(admins, null, 2));
    }
}

dumpAdmins();
