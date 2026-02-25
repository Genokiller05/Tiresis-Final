const { createClient } = require('@supabase/supabase-js');
// require('react-native-url-polyfill/auto');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGuards() {
    console.log(`Checking guards...`);

    const { data: userCheck, error: userCheckError } = await supabase
        .from('guards')
        .select('*');

    if (userCheckError) {
        console.error("Error finding guards:", userCheckError);
        return;
    }

    console.log("Guards found:", userCheck);
}

checkGuards();
