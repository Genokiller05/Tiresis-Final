const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://mhzhorkprnwfbfgmrqaa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos'
);

async function check() {
    console.log("Checking tables...");

    // Check Admins
    const { data: admins, error: errAdmins } = await supabase.from('admins').select('*');
    if (errAdmins) console.log("ADMINS ERROR:", errAdmins.message);
    else {
        console.log("ADMINS COUNT:", admins.length);
        admins.forEach(a => console.log("ADMIN:", a.email, a.fullName));
    }

    // Check Guards
    const { data: guards, error: errGuards } = await supabase.from('guards').select('*');
    if (errGuards) console.log("GUARDS ERROR:", errGuards.message);
    else console.log("GUARDS COUNT:", guards.length);
}

check();
