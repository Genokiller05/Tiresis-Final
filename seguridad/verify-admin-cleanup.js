const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
    console.log('--- Verifying Admin Persistence ---');

    // 1. Check if Diego exists
    const emailToDelete = "aldinalv62@gmail.com";
    console.log(`Checking if ${emailToDelete} exists...`);

    const { data: user } = await supabase
        .from('admins')
        .select('*')
        .eq('email', emailToDelete)
        .single();

    if (user) {
        console.log("User found. Deleting...");
        await supabase.from('admins').delete().eq('email', emailToDelete);
        console.log("✅ User deleted.");
    } else {
        console.log("✅ User not found (already deleted).");
    }

    // 2. List all admins
    console.log("Fetching all admins...");
    const { data: allAdmins, error } = await supabase
        .from('admins')
        .select('fullName, email');

    if (error) {
        console.error("❌ Error fetching admins:", error.message);
    } else {
        console.log(`✅ Total Admins: ${allAdmins.length}`);
        console.log("--- Registered Admins ---");
        allAdmins.forEach(admin => {
            console.log(`- ${admin.fullName} (${admin.email})`);
        });
    }
}

verifyMigration();
