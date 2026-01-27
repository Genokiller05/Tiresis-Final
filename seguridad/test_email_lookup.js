const { createClient } = require('@supabase/supabase-js');

// Credentials (from server.js)
const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailLogin(email) {
    console.log(`Checking access for: ${email}`);

    try {
        const { data, error } = await supabase
            .from('guards')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            console.error('❌ Access Denied: User not found or error occurred.');
            console.error('Error:', error.message);
        } else {
            console.log('✅ Access Granted!');
            console.log('User found:', data.nombre);
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

// Test cases
(async () => {
    // 1. Try a non-existent email
    await testEmailLogin('nobody@example.com');

    // 2. Try to find a valid email (we need to see if there is one, or just try a dummy one)
    // Note: Since I don't know a valid email, I'll first list one if possible.
    const { data } = await supabase.from('guards').select('email').limit(1);
    if (data && data.length > 0 && data[0].email) {
        await testEmailLogin(data[0].email);
    } else {
        console.log('⚠️ No guards found in DB to test valid login.');
    }
})();
