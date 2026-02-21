const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://mhzhorkprnwfbfgmrqaa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos'
);

async function testReportInsert() {
    console.log("Testing insert into reports...");

    // Valid references are tricky if tables are empty/RLS protected. 
    // We need a site_id. Use a random UUID and hope no FK constraint blows up? 
    // FK `site_id` references `sites(id)`. If sites is empty, we CANNOT insert report.
    // FK `created_by_guard_id` references `profiles(id)`.

    // We need to fetch a site first. But we know sites is empty/inaccessible.
    // Use the fallback logic? No, DB constraints don't care about client-side fallbacks.

    // If FKs exist, we are blocked if parent tables are empty.

    // Check if we can disable FK check? No.

    // Try to fetch ANY site.
    const { data: sites } = await supabase.from('sites').select('id').limit(1);
    const siteId = (sites && sites.length > 0) ? sites[0].id : null;

    console.log("Existing Site ID:", siteId);

    if (!siteId) {
        console.log("Cannot test report insert: No sites available and FK required.");
        return;
    }

    const report = {
        site_id: siteId,
        created_by_guard_id: '00000000-0000-0000-0000-000000000000', // Mock UUID, will fail FK probably
        report_type_id: 1,
        status_id: 1,
        priority_id: 1,
        short_description: 'Test Report from script'
    };

    const { error } = await supabase.from('reports').insert([report]);
    if (error) console.log("Insert Result:", error.message);
    else console.log("Insert Result: SUCCESS");
}

testReportInsert();
