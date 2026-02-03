const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vlxfhhmruwafetcxtqti.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGZoaG1ydXdhZmV0Y3h0cXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA3NjgzOCwiZXhwIjoyMDg1NjUyODM4fQ.7vzVMIbQVCSVH8_3l5ejXHc55CR6Npf-O-f6tHk9b0Y';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function deleteUser() {
    const email = 'uziel@gmail.com';
    console.log(`🗑️ Borrando usuario corrupto: ${email}`);

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (user) {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (error) console.error('Error borrando:', error.message);
        else console.log('✅ Usuario eliminado. Ahora puedes registrarlo de nuevo.');
    } else {
        console.log('User no encontrado (ya estaba borrado).');
    }
}

deleteUser();
