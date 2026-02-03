const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vlxfhhmruwafetcxtqti.supabase.co';
// Key provided by user in the prompt
const supabaseKey = 'sb_publishable_rbcmw3T7_laKcoo9LcW1eQ_CQb4Bv48';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKey() {
    console.log('Testing connection with NEW key...');
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Error with NEW key:', error.message);
    } else {
        console.log('✅ SUCCESS: New key works perfectly.');
    }
}

checkKey();
