const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vlxfhhmruwafetcxtqti.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGZoaG1ydXdhZmV0Y3h0cXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA3NjgzOCwiZXhwIjoyMDg1NjUyODM4fQ.7vzVMIbQVCSVH8_3l5ejXHc55CR6Npf-O-f6tHk9b0Y';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function showGuards() {
    console.log('--- LISTA DE GUARDIAS EN BASE DE DATOS ---');

    const { data: guards, error } = await supabaseAdmin
        .from('profiles')
        .select('full_name, document_id, role, created_at, phone')
        .eq('role', 'guard')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching guards:', error.message);
    } else {
        if (guards.length === 0) {
            console.log('(No hay guardias registrados aún)');
        } else {
            guards.forEach(g => {
                console.log(`\n👮 Nombre: ${g.full_name}`);
                console.log(`   ID: ${g.document_id}`);
                console.log(`   Teléfono: ${g.phone || 'N/A'}`);
                console.log(`   Registrado: ${new Date(g.created_at).toLocaleString()}`);
            });
        }
    }
}

showGuards();
