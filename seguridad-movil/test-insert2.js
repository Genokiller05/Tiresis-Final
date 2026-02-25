const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const { data, error } = await supabase.from('reports').insert([{
        short_description: "Test report with new schema",
        created_by_guard_id: "12c32c5d-a6cb-48a7-b39d-aca5f7d6733f",
    }]).select();

    console.log("Insert result:");
    console.log("Data:", data);
    console.log("Error:", error);
}

testInsert();
