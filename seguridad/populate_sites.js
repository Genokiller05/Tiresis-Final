const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://mhzhorkprnwfbfgmrqaa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos'
);

async function testInsert() {
    console.log("Testing minimal insert into sites...");

    const testSite = {
        id: 'test-site-1',
        name: 'Test Site'
    };

    const { data, error } = await supabase.from('sites').upsert([testSite]).select();

    if (error) {
        console.error("ERROR INSERTING:", error);
    } else {
        console.log("SUCCESS INSERTING:", data);
    }
}

testInsert();
