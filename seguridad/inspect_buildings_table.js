const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log('Inspecting "buildings" table...');

    // Check one record to see columns
    const { data, error } = await supabase.from('buildings').select('*').limit(1);

    if (error) {
        console.error('Error selecting from buildings:', error);
    } else {
        console.log('Columns found in buildings:', data && data.length > 0 ? Object.keys(data[0]) : 'No records found to introspect columns.');
    }

    // Try a broad select to see if table exists and what it returns
    const { data: all, error: allErr } = await supabase.from('buildings').select('*');
    if (allErr) {
        console.error('Error selecting all from buildings:', allErr.message);
    } else {
        console.log('Total buildings:', all.length);
        if (all.length > 0) {
            console.log('Sample record:', JSON.stringify(all[0], null, 2));
        }
    }
}

inspectTable();
