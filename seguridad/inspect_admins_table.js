const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAdmins() {
    console.log('Inspecting "admins" table...');
    const { data, error } = await supabase.from('admins').select('*').limit(1);
    if (error) {
        console.error('Error selecting from admins:', error.message);
    } else {
        if (data.length > 0) {
            console.log('Admin record sample:', JSON.stringify(data[0], null, 2));
            console.log('ID type:', typeof data[0].id);
        } else {
            console.log('Admins table is empty.');
        }
    }
}

inspectAdmins();
