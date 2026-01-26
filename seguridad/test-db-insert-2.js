const { createClient } = require('@supabase/supabase-js');

// Project 2 Credentials (from memory)
const supabaseUrl = 'https://uklohjdookcdibmogivq.supabase.co';
// This key looks weird (clerk-like?), but let's try it. If it fails, we know we need the JWT.
const supabaseKey = 'sb_publishable_6dJSMP-j-Caj3KnLrgN2EQ_ud8MOqUp';

console.log("Testing connection to Project 2:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    try {
        const { data, error } = await supabase
            .from('admins')
            .select('count')
            .limit(1);

        if (error) {
            console.error("❌ Connection Failed:", error.message);
        } else {
            console.log("✅ Connection SUCCESS! Table found.");
        }
    } catch (err) {
        console.error("Critical Error:", err.message);
    }
}

testInsert();
