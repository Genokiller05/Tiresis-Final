const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vlxfhhmruwafetcxtqti.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGZoaG1ydXdhZmV0Y3h0cXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA3NjgzOCwiZXhwIjoyMDg1NjUyODM4fQ.7vzVMIbQVCSVH8_3l5ejXHc55CR6Npf-O-f6tHk9b0Y';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkGuard() {
    const email = 'uziel@gmail.com';
    console.log(`🔍 Checking user: ${email}`);

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const existing = users.find(u => u.email === email);
    if (existing) {
        console.log('⚠️ User EXISTS in Auth system.');
        console.log('ID:', existing.id);
        console.log('Created:', existing.created_at);
        console.log('Metadata:', existing.user_metadata);

        // Check profile
        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', existing.id).single();
        if (profile) {
            console.log('✅ Profile also exists.');
        } else {
            console.log('❌ Profile MISSING (This is likely the problem).');
        }

    } else {
        console.log('✅ User DOES NOT exist. 500 Error is due to something else.');
    }
}

checkGuard();
