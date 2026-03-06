const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const adminsPath = path.join(__dirname, 'data', 'admins.json');

async function syncIds() {
    console.log('Syncing Supabase IDs to admins.json...');

    if (!fs.existsSync(adminsPath)) {
        console.error('admins.json not found');
        return;
    }

    const localAdmins = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));

    const { data: remoteAdmins, error } = await supabase.from('admins').select('id, email');

    if (error) {
        console.error('Error fetching admins from Supabase:', error.message);
        return;
    }

    let updatedCount = 0;
    const updatedAdmins = localAdmins.map(local => {
        const remote = remoteAdmins.find(r => r.email.toLowerCase() === local.email.toLowerCase());
        if (remote) {
            if (local.id !== remote.id) {
                console.log(`Updating ID for ${local.email}: ${local.id} -> ${remote.id}`);
                local.id = remote.id;
                updatedCount++;
            }
        } else {
            console.warn(`Admin in JSON not found in Supabase: ${local.email}`);
        }
        return local;
    });

    if (updatedCount > 0) {
        fs.writeFileSync(adminsPath, JSON.stringify(updatedAdmins, null, 2));
        console.log(`Successfully updated ${updatedCount} admin IDs in admins.json`);
    } else {
        console.log('No updates needed. All IDs are in sync.');
    }
}

syncIds();
