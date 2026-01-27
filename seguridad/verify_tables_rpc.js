const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log("--- RPC Table Check ---");

    const { data, error } = await supabase.rpc('get_all_tables');

    if (error) {
        console.error("RPC FAILED:", error.message);
    } else {
        console.log("Tables found via RPC:", data);

        const hasAdmins = data && data.includes('admins');
        const hasGuards = data && data.includes('guards');

        console.log("Admins table exists?", hasAdmins);
        console.log("Guards table exists?", hasGuards);
    }
}

checkTables();
