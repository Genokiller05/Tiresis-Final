const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseServiceKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function addStatuses() {
    const { data, error } = await supabaseAdmin.from('report_statuses').insert([
        { code: 'cancelled', name: 'Cancelado' },
        { code: 'suspended', name: 'Suspendido' }
    ]).select();

    if (error) {
        if (error.code === '23505') {
            console.log('Already exist. Trying to update...');
        } else {
            console.error('Error inserting:', error);
        }
    } else {
        console.log('Inserted:', data);
    }
}
addStatuses();
