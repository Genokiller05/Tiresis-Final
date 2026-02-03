const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vlxfhhmruwafetcxtqti.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGZoaG1ydXdhZmV0Y3h0cXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA3NjgzOCwiZXhwIjoyMDg1NjUyODM4fQ.7vzVMIbQVCSVH8_3l5ejXHc55CR6Npf-O-f6tHk9b0Y';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixLogin() {
    const email = 'brianaxool.1c@gmail.com';
    const newPassword = 'tiresis123';

    console.log(`🔧 Arreglando cuenta para: ${email}`);

    // 1. Get User
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('❌ Usuario no encontrado.');
        return;
    }

    console.log(`✅ Usuario encontrado: ${user.id}`);
    console.log(`   Estado actual: ${user.email_confirmed_at ? 'CONFIRMADO' : 'PENDIENTE'}`);

    // 2. Update User (Confirm Email + Set Password)
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
            email_confirm: true,
            password: newPassword,
            user_metadata: { email_verified: true }
        }
    );

    if (updateError) {
        console.error('❌ Error actualizando usuario:', updateError.message);
    } else {
        console.log('✅ ¡Usuario CONFIRMADO y Contraseña actualizada!');
        console.log(`👉 Nueva contraseña: ${newPassword}`);
    }
}

fixLogin();
