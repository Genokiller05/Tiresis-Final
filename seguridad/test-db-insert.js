const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Testing direct DB insert...");

    const testUser = {
        fullName: "Direct Insert Test",
        email: `direct_test_${Date.now()}@example.com`,
        password: "password123",
        companyName: "Test Corp",
        location: "Test Location",
        lat: 0,
        lng: 0,
        zone: []
    };

    console.log("Attempting to insert:", testUser.email);

    const { data, error } = await supabase
        .from('admins')
        .insert([testUser])
        .select();

    if (error) {
        console.error("❌ INSERT FAILED:", JSON.stringify(error, null, 2));
    } else {
        console.log("✅ INSERT SUCCESS:", data);
        // Optional: clean up
        // await supabase.from('admins').delete().eq('email', testUser.email);
    }
}

testInsert();
