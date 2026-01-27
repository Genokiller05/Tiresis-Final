const { createClient } = require('@supabase/supabase-js');

// New credentials (from server.js)
const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing Unified Supabase Connection...');
    console.log('URL:', supabaseUrl);

    try {
        // Try to fetch admins (as server.js does)
        const { data, error } = await supabase.from('admins').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            console.error('Code:', error.code);
            console.error('Hint:', error.hint);
        } else {
            console.log('✅ Connection Successful!');
            console.log('Successfully connected to the "admins" table.');
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

testConnection();
