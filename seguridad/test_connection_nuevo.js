const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing Supabase Connection...');
    try {
        const { data, error } = await supabase.from('admins').select('*').limit(1);

        if (error) {
            console.error('Connection Failed! Error:', error.message);
        } else {
            console.log('Connection Successful!');
            console.log('Data details:', data);
        }
    } catch (err) {
        console.error('Exception during connection:', err.message);
    }
}

testConnection();
