const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    const siteId = '29e48d60-df1e-4b7c-91dc-184ca1ea2c3e'; // Site ID from previous inspection
    console.log(`Cleaning up duplicates for site: ${siteId}`);

    // IDs of duplicate buildings identified in previous step
    const duplicatesToDelete = [
        '1773616755943', // Duplicate of 'tinu'
        '1773617035457'  // Duplicate of 'b'
    ];

    const { data, error } = await supabase
        .from('buildings')
        .delete()
        .in('id', duplicatesToDelete);

    if (error) {
        console.error('Error deleting duplicates:', error);
    } else {
        console.log('Successfully deleted duplicate buildings.');
        
        // Final check
        const { data: final } = await supabase.from('buildings').select('id, name').eq('site_id', siteId);
        console.log('Remaining buildings for site:', final.length);
        final.forEach(b => console.log(` - ${b.name} (${b.id})`));
    }
}

cleanup();
