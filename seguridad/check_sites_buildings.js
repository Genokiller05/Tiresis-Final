const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://mhzhorkprnwfbfgmrqaa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos'
);

async function check() {
    console.log("Checking tables...");

    // Check Sites
    const { data: sites, error: errSites } = await supabase.from('sites').select('*');
    if (errSites) console.log("SITES ERROR:", errSites.message);
    else {
        console.log("SITES COUNT:", sites.length);
        console.log("SITES DATA:", sites);
    }

    // Check Buildings
    const { data: buildings, error: errBuildings } = await supabase.from('buildings').select('*');
    if (errBuildings) console.log("BUILDINGS ERROR:", errBuildings.message);
    else {
        console.log("BUILDINGS COUNT:", buildings.length);
        console.log("BUILDINGS DATA:", buildings);
    }

    // Check report_types
    const { data: reportTypes, error: errTypes } = await supabase.from('report_types').select('*');
    if (errTypes) console.log("REPORT_TYPES ERROR:", errTypes.message);
    else console.log("REPORT_TYPES COUNT:", reportTypes.length);
}

check();
