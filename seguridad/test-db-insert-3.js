const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

console.log("Testing connection to Project 3:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    try {
        // Try to read admins table
        const { data, error } = await supabase
            .from('admins')
            .select('count')
            .limit(1);

        if (error) {
            console.error("❌ Connection/Query Failed:", JSON.stringify(error, null, 2));
        } else {
            console.log("✅ Connection SUCCESS! Table found and readable.");
        }
    } catch (err) {
        console.error("Critical Error:", err.message);
    }
}

testInsert();
