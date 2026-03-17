const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data: buildings, error } = await supabase.from('buildings').select('*');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('--- BUILDINGS IN DATABASE ---');
    buildings.forEach(b => {
        let isValid = true;
        if (!b.geometry || !Array.isArray(b.geometry) || b.geometry.length < 3) {
            isValid = false;
        }
        console.log(`ID: ${b.id} | Name: ${b.name} | Site: ${b.site_id} | Valid Geometry: ${isValid}`);
        if (!isValid) {
            console.log(`  Invalid Geometry Detail: ${JSON.stringify(b.geometry)}`);
        }
    });
    console.log('-----------------------------');
}

inspect();
