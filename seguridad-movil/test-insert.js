const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkReportsSchema() {
    console.log('Querying one report to see schema...');
    const { data, error } = await supabase.from('reports').select('*').limit(1);
    if (error) {
        console.error('Error querying reports:', error);
    } else {
        console.log('Sample report:', data);
    }

    console.log('\nTrying to insert to reports with camelCase...');
    const camelCaseReport = {
        fechaHora: new Date().toISOString(),
        tipo: 'Test',
        origen: 'Guardia',
        sitioArea: 'Patrullaje General',
        estado: 'Pendiente',
        detalles: { descripcion: 'test' }
    };
    const response1 = await supabase.from('reports').insert([camelCaseReport]).select();
    console.log('Insert camelCase result:', response1.error || 'Success! ' + JSON.stringify(response1.data));
}

checkReportsSchema();
