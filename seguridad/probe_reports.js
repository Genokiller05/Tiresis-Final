const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://mhzhorkprnwfbfgmrqaa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos'
);

async function probe() {
    console.log("Probing columns...");

    // 1. Try selecting 'fechaHora' (Old Schema)
    const { error: errOld } = await supabase.from('reports').select('fechaHora').limit(1);
    if (errOld) console.log("Old Schema Check (fechaHora):", errOld.message);
    else console.log("Old Schema Check (fechaHora): EXISTS or RLS permitted");

    // 2. Try selecting 'site_id' (New Schema)
    const { error: errNew } = await supabase.from('reports').select('site_id').limit(1);
    if (errNew) console.log("New Schema Check (site_id):", errNew.message);
    else console.log("New Schema Check (site_id): EXISTS or RLS permitted");
}

probe();
