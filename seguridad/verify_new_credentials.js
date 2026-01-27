const { createClient } = require('@supabase/supabase-js');

// New credentials provided by user
const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyConnection() {
    console.log("--- Verifying NEW Credentials ---");
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Key: ${supabaseKey}`);

    try {
        // Try a simple select from a public table (or just check health if possible)
        // We'll try to select from 'admins' assuming the user ran the SQL there.
        const { data, error } = await supabase.from('admins').select('count', { count: 'exact', head: true });

        if (error) {
            console.error("❌ Connection Failed / Error:", error.message);
            console.error("   Details:", error);
        } else {
            console.log("✅ Connection SUCCESS! Admins table found.");
        }
    } catch (err) {
        console.error("❌ Exception:", err.message);
    }
}

verifyConnection();
