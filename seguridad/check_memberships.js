const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMemberships() {
    console.log('Checking site_memberships for admins...');

    // Get all admins
    const { data: admins, error: errAdmins } = await supabase.from('admins').select('id, email, fullName');
    if (errAdmins) return console.error('Error fetching admins:', errAdmins.message);

    console.log(`Found ${admins.length} admins in Supabase.`);

    for (const admin of admins) {
        console.log(`\nAdmin: ${admin.fullName} (${admin.email}) [ID: ${admin.id}]`);

        const { data: m, error: errM } = await supabase
            .from('site_memberships')
            .select('*, sites(*)')
            .eq('user_id', admin.id);

        if (errM) {
            console.error(`  Error fetching memberships: ${errM.message}`);
        } else {
            console.log(`  Memberships found: ${m.length}`);
            m.forEach(row => {
                console.log(`  - Site: ${row.sites?.name || 'Unknown'} [SiteID: ${row.site_id}]`);
            });
        }
    }
}

checkMemberships();
