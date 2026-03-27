const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkColumns() {
    const { data, error } = await supabase.from('report_types').select('*').limit(1);
    console.log("Data:", data, "Error:", error);
}

checkColumns();
