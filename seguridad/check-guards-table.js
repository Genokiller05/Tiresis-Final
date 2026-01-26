const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGuards() {
    console.log("Checking 'guards' table...");
    const { data, error } = await supabase.from('guards').select('count').limit(1);

    if (error) {
        console.error("❌ Error accessing 'guards':", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ 'guards' table exists and is readable.");
    }
}

checkGuards();
