const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testGuard() {
    console.log("--- Guard Insert Test ---");
    const testId = `G-TEST-${Date.now()}`;

    // Attempt simple insert
    const { data, error } = await supabase
        .from('guards')
        .insert([{
            idEmpleado: testId,
            nombre: "Test Guard",
            estado: "Activo"
        }])
        .select();

    if (error) {
        console.log("ERROR CODE:", error.code);
        console.log("ERROR MSG:", error.message);
        console.log("ERROR HINT:", error.hint);
    } else {
        console.log("SUCCESS. Inserted Guard:", data);
    }
}

testGuard();
