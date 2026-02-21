const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
    console.log('Checking buildings table...');
    const { data: buildings, error: buildingsError } = await supabase.from('buildings').select('*').limit(1);
    if (buildingsError) console.error('Error fetching buildings:', buildingsError);
    else console.log('Buildings found:', buildings);

    console.log('Checking reports table structure...');
    const { data: reports, error: reportsError } = await supabase.from('reports').select('*').limit(1);

    if (reportsError) {
        console.error('Error fetching reports:', reportsError);
    } else if (reports && reports.length > 0) {
        console.log('Report columns:', Object.keys(reports[0]));
    } else {
        console.log('Reports table exists but is empty. Trying insert to test columns.');
    }
}

checkTables();
