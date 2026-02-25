import { supabase } from './lib/supabase';

async function diagnoseGuardsSchema() {
    console.log('=== Diagnosing Guards Table Schema ===\n');

    // Try to get any single row to see what columns exist
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
        console.log('No data found in guards table to inspect schema.');
    }
}

diagnoseGuardsSchema();
