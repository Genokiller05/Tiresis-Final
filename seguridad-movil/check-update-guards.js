const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uklohjdookcdibmogivq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6dJSMP-j-Caj3KnLrgN2EQ_ud8MOqUp';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
    const { data, error } = await supabase.from('guards').select('*');
    if (error) {
        console.error("Error querying guards:", error);
    } else {
        console.log("Guards:", data);
    }
})();
