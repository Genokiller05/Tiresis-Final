const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
    console.log('Checking sites table...');
    const { data: sites, error: sitesError } = await supabase.from('sites').select('*');
    if (sitesError) console.error('Error fetching sites:', sitesError);
    else console.log('Sites found:', sites ? sites.length : 0);

    console.log('Checking report_types table...');
    const { data: types, error: typesError } = await supabase.from('report_types').select('*');
    if (typesError) console.error('Error fetching report_types:', typesError);
    else console.log('Report types found:', types ? types.length : 0, types);
}

checkTables();
