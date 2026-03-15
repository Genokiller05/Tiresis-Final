const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLimits() {
    console.log('--- DIAGNÓSTICO DE LÍMITES ---');

    // 1. Contar Guardias
    const { data: guards, error: gError } = await supabase.from('guards').select('id, nombre, site_id');
    if (gError) console.error('Error guardias:', gError.message);
    else {
        console.log(`Total Guardias: ${guards.length}`);
        const bySite = {};
        guards.forEach(g => {
            bySite[g.site_id] = (bySite[g.site_id] || 0) + 1;
        });
        console.log('Guardias por sitio:', bySite);
    }

    // 2. Contar Edificios
    const { data: buildings, error: bError } = await supabase.from('buildings').select('id, name, site_id');
    if (bError) console.error('Error edificios:', bError.message);
    else {
        console.log(`Total Edificios: ${buildings.length}`);
        const bySiteB = {};
        buildings.forEach(b => {
            bySiteB[b.site_id] = (bySiteB[b.site_id] || 0) + 1;
        });
        console.log('Edificios por sitio:', bySiteB);
    }
    
    // 3. Verificar estado de Admin
    const { data: admins, error: aError } = await supabase.from('admins').select('email, plan');
    if (aError) console.error('Error admins:', aError.message);
    else {
      console.log('Admins y Planes:', admins);
    }
}

checkLimits();
