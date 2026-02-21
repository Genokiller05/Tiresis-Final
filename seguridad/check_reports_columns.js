const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://mhzhorkprnwfbfgmrqaa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos'
);

async function checkColumns() {
    console.log("Checking reports table columns...");

    // Attempt to select a single row to see returned keys
    const { data, error } = await supabase.from('reports').select('*').limit(1);

    if (error) {
        console.log("ERROR selecting from reports:", error);
    } else if (data && data.length > 0) {
        console.log("Columns found in reports:", Object.keys(data[0]));
    } else {
        console.log("Reports table is empty. Trying to insert a dummy to see schema violations.");
        // Try inserting an empty object to trigger a schema error that might list columns
        const { error: insertError } = await supabase.from('reports').insert({});
        if (insertError) {
            console.log("Insert Error (may reveal schema):", insertError);
        }
    }
}

checkColumns();
