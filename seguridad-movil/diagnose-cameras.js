const { createClient } = require('@supabase/supabase-js');
require('react-native-url-polyfill/auto');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseAnonKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseCamerasSchema() {
    console.log('=== Diagnosing Cameras Table Schema ===\n');

    const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying cameras:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Sample row from cameras table:');
        console.log(JSON.stringify(data[0], null, 2));
        console.log('\nColumn names found:');
        console.log(Object.keys(data[0]));
    } else {
        console.log('No data found in cameras table. Attempting to insert dummy to check columns is risky without knowing schema.');
        console.log('Table exists but is empty.');
    }
}

diagnoseCamerasSchema();
