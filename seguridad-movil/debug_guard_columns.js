
const { createClient } = require('@supabase/supabase-js');

// Credentials (from server.js/test_email_lookup.js)
const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(supabaseUrl, supabaseKey);

const fs = require('fs');

async function inspectGuard() {
    console.log('Fetching one guard to inspect columns...');

    try {
        const { data, error } = await supabase
            .from('guards')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error fetching guard:', error.message);
            fs.writeFileSync('debug_output.json', JSON.stringify({ error: error.message }, null, 2));
        } else if (data && data.length > 0) {
            console.log('--- Guard Found ---');
            fs.writeFileSync('debug_output.json', JSON.stringify(data[0], null, 2));
            console.log('Output written to debug_output.json');
        } else {
            console.log('No guards found in database.');
            fs.writeFileSync('debug_output.json', JSON.stringify({ message: "No guards found" }, null, 2));
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        fs.writeFileSync('debug_output.json', JSON.stringify({ error: err.toString() }, null, 2));
    }
}

inspectGuard();
