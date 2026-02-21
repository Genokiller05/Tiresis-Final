const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://mhzhorkprnwfbfgmrqaa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos'
);

async function verify() {
    console.log("--- FINAL VERIFICATION ---");

    // Check for NEW column 'site_id'
    const { error: errNew } = await supabase.from('reports').select('site_id').limit(1);
    if (errNew) {
        console.log("NEW (site_id): ❌ ERROR ->", errNew.message);
    } else {
        console.log("NEW (site_id): ✅ OK (Column exists)");
    }

    // Check for OLD column 'fechaHora'
    const { error: errOld } = await supabase.from('reports').select('fechaHora').limit(1);
    if (errOld) {
        // We EXPECT an error here if the column is gone
        console.log("OLD (fechaHora): ✅ OK (Error as expected) ->", errOld.message);
    } else {
        console.log("OLD (fechaHora): ❌ WARNING (Column still exists!)");
    }
}

verify();
