const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vlxfhhmruwafetcxtqti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGZoaG1ydXdhZmV0Y3h0cXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNzY4MzgsImV4cCI6MjA4NTY1MjgzOH0.splkdHaqaoaeILuPvGDLZ-QkwytDQXGOBo1QJMLSf0w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking connection to:', supabaseUrl);
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error connecting to table "profiles":', error.message);
        if (error.code === '42P01') {
            console.log('✅ DIAGNOSIS: The table "profiles" DOES NOT EXIST.');
        } else {
            console.log('❌ DIAGNOSIS: Connection error or permission issue.');
        }
    } else {
        console.log('SUCCESS: Table "profiles" exists and is accessible.');
    }
}

checkTable();
