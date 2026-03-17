const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data: buildings, error } = await supabase.from('buildings').select('id, name, site_id');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('--- BUILDINGS IN DATABASE ---');
    console.log(`Total count: ${buildings.length}`);
    buildings.forEach(b => {
        console.log(`ID: ${b.id} | Name: ${b.name} | Site: ${b.site_id}`);
    });
    console.log('-----------------------------');

    const { data: admins, error: adminErr } = await supabase.from('admins').select('email, plan, id');
    if (adminErr) {
        console.error('Admin Error:', adminErr);
    } else {
        console.log('--- ADMINS IN DATABASE ---');
        admins.forEach(a => {
            console.log(`Email: ${a.email} | Plan: ${a.plan} | ID: ${a.id}`);
        });
        console.log('---------------------------');
    }
}

inspect();
