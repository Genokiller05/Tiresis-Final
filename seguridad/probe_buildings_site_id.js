const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    console.log('Probing buildings table with site_id...');
    const testBuilding = {
        id: 'test-' + Date.now(),
        name: 'Test Building',
        geometry: [],
        site_id: 'some-site-id' // Probing if this column exists
    };

    const { error } = await supabase.from('buildings').insert([testBuilding]);

    if (error) {
        console.log('INSERT ERROR:', error.message);
        console.log('ERROR CODE:', error.code);
        if (error.message.includes('column') && error.message.includes('not exist')) {
            console.log('CONFIRMED: Column site_id does not exist.');
        }
    } else {
        console.log('SUCCESS: Column site_id exists and insert worked.');
        // Cleanup
        await supabase.from('buildings').delete().eq('id', testBuilding.id);
    }
}

probe();
