const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    console.log("--- Verificando Usuarios ---");

    // 1. Check Admins
    const { data: admins, error: adminError } = await supabase.from('admins').select('*');
    if (adminError) console.error("Error fetching admins:", adminError.message);
    else {
        console.log(`Admins encontrados: ${admins.length}`);
        admins.forEach(a => console.log(` - Admin: ${a.email} (Password: ${a.password})`));
    }

    // 2. Check Guards
    const { data: guards, error: guardError } = await supabase.from('guards').select('*');
    if (guardError) console.error("Error fetching guards:", guardError.message);
    else {
        console.log(`Guardias encontrados: ${guards.length}`);
        guards.forEach(g => console.log(` - Guardia: ${g.nombre} (${g.email})`));
    }
}

checkUsers();
