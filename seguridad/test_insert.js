const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("--- Test Insert ---");

    const testAdmin = {
        email: `test_insert_${Date.now()}@example.com`,
        password: "test",
        fullName: "Test Insert"
    };

    console.log("Intentando insertar:", testAdmin);

    const { data, error } = await supabase.from('admins').insert([testAdmin]).select();

    if (error) {
        console.error("❌ FAILED:", error.message);
        console.error("Details:", error.details);
        console.error("Hint:", error.hint);
    } else {
        console.log("✅ SUCCESS:", data);
    }
}

testInsert();
