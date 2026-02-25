const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    // We can't query information_schema from the client directly usually, but let's try querying "reportes" instead of "reports".
    const { data: reportes, error: re } = await supabase.from('reportes').select('*').limit(1);
    console.log('reportes table:', re ? 'Error/Not exists' : 'Exists! Columns: ' + (reportes[0] ? Object.keys(reportes[0]).join(', ') : 'empty but exists'));
}
checkTables();
