const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSchema() {
    console.log("--- Debugging Schema Visibility ---");

    // 1. Check what tables are visible to this client
    console.log("Querying information_schema.tables...");

    // Note: We can't easily query information_schema with the JS client if permissions aren't set up for it, 
    // but often it's open.
    // However, a better check might be to try and select from a table we KNOW exists, like 'alerts' 
    // (since the hint mentioned it).

    // Let's try to list all tables via a raw RPC call if possible, or just standard select if not.
    // Since we don't have a handy RPC, we'll try to select from 'admins' and print the specific error again clearly.

    const { data, error } = await supabase.from('admins').select('count', { count: 'exact', head: true });

    if (error) {
        console.error("❌ 'admins' access failed:", error.message);
        console.error("   Hint:", error.hint);
        console.error("   Details:", error.details);
    } else {
        console.log("✅ 'admins' table is visible! Count:", data);
    }

    const { data: guardsData, error: guardsError } = await supabase.from('guards').select('count', { count: 'exact', head: true });

    if (guardsError) {
        console.error("❌ 'guards' access failed:", guardsError.message);
    } else {
        console.log("✅ 'guards' table is visible! Count:", guardsData);
    }
}

debugSchema();
