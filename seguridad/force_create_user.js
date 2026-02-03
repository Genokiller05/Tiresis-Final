const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vlxfhhmruwafetcxtqti.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA3NjgzOCwiZXhwIjoyMDg1NjUyODM4fQ.7vzVMIbQVCSVH8_3l5ejXHc55CR6Npf-O-f6tHk9b0Y';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthAdmin() {
    console.log('Testing Admin Auth (List Users)...');

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        console.error('FAILED. Full error log:', JSON.stringify(error, null, 2));
        console.error('Error Message:', error.message);
    } else {
        console.log('SUCCESS! Users found:', data.users.length);
        if (data.users.length > 0) {
            console.log('First user:', data.users[0].email);
        }
    }
}

testAuthAdmin();
