const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fofpkctgqhdudyyocuyn.supabase.co';
// This should be the SERVICE ROLE KEY (ends in Bb7s)
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZnBrY3RncWhkdWR5eW9jdXluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA3NTQ1NywiZXhwIjoyMDg1NjUxNDU3fQ.Psq_UpATmXLitbRle6021Fob7yDRUUnADEB-RsrBb7s';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminCreate() {
    const testEmail = `test_admin_${Date.now()}@example.com`;
    console.log('Attempting to create user:', testEmail);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: { role: 'admin' }
    });

    if (error) {
        console.error('FAILED - Supabase Admin Error:', error);
    } else {
        console.log('SUCCESS - User created:', data.user.id);

        // Cleanup
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        console.log('User deleted (cleanup)');
    }
}

testAdminCreate();
