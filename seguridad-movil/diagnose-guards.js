const { createClient } = require('@supabase/supabase-js');
require('react-native-url-polyfill/auto'); // Might fail if not compatible with node, but let's try or remove if fails

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseAnonKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseGuardsSchema() {
    console.log('=== Diagnosing Guards Table Schema ===\n');

    const { data, error } = await supabase
        .from('guards')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying guards:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Sample row from guards table:');
        console.log(JSON.stringify(data[0], null, 2));
        console.log('\nColumn names found:');
        console.log(Object.keys(data[0]));
    } else {
        console.log('No data found in guards table to inspect schema. Attempting to insert dummy to check columns? No, dangerous.');
    }
}

diagnoseGuardsSchema();
