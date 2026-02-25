const { createClient } = require('@supabase/supabase-js');

async function checkUrl(url, key) {
    try {
        const supabase = createClient(url, key);
        const { data, error } = await supabase.from('reports').select('*').limit(1);
        console.log(`[${url}] Result:`, error ? error.message : 'Success!');
    } catch (e) {
        console.error(`[${url}] Exception:`, e.message);
    }
}

async function main() {
    await checkUrl('https://uklohjdookcdibmogivq.supabase.co', 'sb_publishable_6dJSMP-j-Caj3KnLrgN2EQ_ud8MOqUp');
    await checkUrl('https://mhzhorkprnwfbfgmrqaa.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oemhvcmtwcm53ZmJmZ21ycWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzgyODUsImV4cCI6MjA3OTUxNDI4NX0.eXKbWsoHTcXqh5De5hk77Z1ftxJiaTDB3VwRPpe6Nos');
}
main();
