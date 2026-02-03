const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vlxfhhmruwafetcxtqti.supabase.co';
// Using Service Role Key to bypass RLS and access auth.users
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGZoaG1ydXdhZmV0Y3h0cXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA3NjgzOCwiZXhwIjoyMDg1NjUyODM4fQ.7vzVMIbQVCSVH8_3l5ejXHc55CR6Npf-O-f6tHk9b0Y';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixProfile() {
    const emailToFix = 'brianaxool.1c@gmail.com';
    console.log(`🔍 Buscando usuario: ${emailToFix}`);

    // 1. Get User ID from Auth
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
        console.error('❌ Error listando usuarios:', userError.message);
        return;
    }

    const user = users.find(u => u.email === emailToFix);

    if (!user) {
        console.error('❌ Usuario NO ENCONTRADO en Auth. ¿Seguro que se registró?');
        return;
    }

    console.log(`✅ Usuario encontrado (Auth ID): ${user.id}`);

    // 2. Check if Profile exists
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile) {
        console.log('⚠️ El perfil YA EXISTE:', profile);
        console.log('El problema de login podría ser otro (ej: contraseña incorrecta).');
    } else {
        console.log('🔸 El perfil NO existe. Creándolo manualmente...');

        // 3. Insert Profile
        const { error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert([
                {
                    id: user.id,
                    full_name: 'JEHIELI19', // Name from emails.json context or generic
                    document_id: 'ADMIN-RECOVERY-' + Date.now(),
                    role: 'admin',
                    is_active: true
                }
            ]);

        if (insertError) {
            console.error('❌ Error creando perfil:', insertError.message);
        } else {
            console.log('✅ ¡Perfil CREADO exitosamente!');
        }
    }
}

fixProfile();
