const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing Supabase Connection...');
    try {
        const { data, error } = await supabase.from('admins').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            if (error.code === 'PGRST116') {
                console.log('Note: Table might not exist, but connection likely worked.');
            }
        } else {
            console.log('✅ Connection Successful!');
            console.log('Status: Readable');
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

testConnection();
