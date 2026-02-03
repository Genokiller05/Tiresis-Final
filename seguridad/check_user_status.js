const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fofpkctgqhdudyyocuyn.supabase.co';
// Service Role Key
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA3NTQ1NywiZXhwIjoyMDg1NjUxNDU3fQ.Psq_UpATmXLitbRle6021Fob7yDRUUnADEB-RsrBb7s';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
    const email = 'jehielixool@gmail.com';
    console.log('Checking status for:', email);

    // List users to find the specific one
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (user) {
        console.log('User FOUND:');
        console.log('ID:', user.id);
        console.log('Role:', user.role);
        console.log('Confirmed:', user.email_confirmed_at);
        console.log('Banned:', user.banned_until);
        console.log('Metadata:', user.user_metadata);
    } else {
        console.log('User NOT found in Auth system.');
    }
}

checkUser();
