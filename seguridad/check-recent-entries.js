const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentEntries() {
    console.log("Fetching recent entries...");
    const { data, error } = await supabase
        .from('entries_exits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error fetching:", error);
    } else {
        console.log("Recent entry:", JSON.stringify(data, null, 2));
    }
}

checkRecentEntries();
