const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vlxfhhmruwafetcxtqti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGZoaG1ydXdhZmV0Y3h0cXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNzY4MzgsImV4cCI6MjA4NTY1MjgzOH0.splkdHaqaoaeILuPvGDLZ-QkwytDQXGOBo1QJMLSf0w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSystem() {
    console.log('--- BUSCANDO USUARIO RECIENTE ---');
    // List last 5 profiles
    const { data: profiles, error: errProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (errProfiles) console.error('Error fetching profiles:', errProfiles.message);
    else {
        console.log('Últimos 5 perfiles registrados:');
        profiles.forEach(p => console.log(` - [${p.role}] ${p.full_name} (Creado: ${new Date(p.created_at).toLocaleString()})`));
    }

    console.log('\n--- RESUMEN DEL SISTEMA ---');

    const { count: countProfiles } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    console.log(`Total Usuarios (Profiles): ${countProfiles || 0}`);

    const { count: countSites } = await supabase.from('sites').select('*', { count: 'exact', head: true });
    console.log(`Total Sitios: ${countSites || 0}`);

    const { count: countEvents } = await supabase.from('events').select('*', { count: 'exact', head: true });
    console.log(`Total Eventos/Reportes: ${countEvents || 0}`);
}

checkSystem();
