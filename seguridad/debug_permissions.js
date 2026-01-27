const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPermissions() {
    console.log("--- Debugging Permissions ---");

    // Try to inspect information_schema directly (might fail if permissions restricted)
    // We want to see if 'anon' has 'INSERT' on 'admins'

    // Since we likely can't query information_schema directly due to RLS/permissions on IT,
    // we will rely on the error message details from a raw RPC if possible, 
    // OR just try to assume the previous failure 'table not found' IS the permission error.

    // However, let's try a different approach:
    // Call a built-in function or just try to select * from admins.

    const { data, error } = await supabase
        .from('admins')
        .select('*')
        .limit(1);

    if (error) {
        console.log("FAIL: " + error.message);
    } else {
        console.log("SUCCESS");
    }

    console.log("\n--- Checking RLS Policies (Inferred) ---");
    // We can't query pg_policies directly via client usually.
}

debugPermissions();
