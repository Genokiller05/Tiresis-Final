const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
    const { data, error } = await supabase
        .from('entries_exits')
        .select('*')
        .limit(1);

    console.log('Error trying entries_exits:', error);

    // Use a rpc or something? We can't query information_schema directly from client usually without PGRST errors.
    // Instead let's just use the `supabase.rpc` or look at other files.
}

checkTables();
