const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mhzhorkprnwfbfgmrqaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function probe() {
    // 1. Check buildings vs sites again
    const { error: errBuildings } = await supabase.from('buildings').select('count').limit(1);
    const { error: errSites } = await supabase.from('sites').select('count').limit(1);
    console.log('buildings exist?', !errBuildings, errBuildings ? errBuildings.message : '');
    console.log('sites exist?', !errSites, errSites ? errSites.message : '');

    // 2. Probe reports columns
    console.log('Probing reports insert...');

    // Try Old Schema
    const { error: errOld } = await supabase.from('reports').insert([{
        fechaHora: new Date().toISOString(),
        tipo: 'Test',
        origen: 'Test',
        sitioArea: 'Test',
        estado: 'Pendiente',
        detalles: { note: 'Probe' }
    }]);

    if (!errOld) {
        console.log('SUCCESS: Old schema (fechaHora) works!');
    } else {
        console.log('FAIL: Old schema error:', errOld.message);
    }

    // Try New/Relational Schema (Partial, guessing columns if types/priorities tables missing)
    // If relational tables missing, we can't insert FKs easily.
    // Try just 'created_at', 'description'
    const { error: errNew } = await supabase.from('reports').insert([{
        created_at: new Date().toISOString(),
        short_description: 'Probe',
        // If FKs required, this will fail.
    }]);

    if (!errNew) {
        console.log('SUCCESS: New schema (short_description) works!');
    } else {
        console.log('FAIL: New schema error:', errNew.message);
    }
}

probe();
