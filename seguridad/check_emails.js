const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

const fs = require('fs');
async function checkEmails() {
    let output = "--- Verificando Emails ---\n";
    const emails = ["aldinalv6@gmail.com", "aldinalv62@gmail.com"];

    for (const email of emails) {
        const { data, error } = await supabase
            .from('admins')
            .select('email, password, fullName')
            .eq('email', email)
            .single();

        if (data) {
            output += `✅ ENCONTRADO: ${email}\n`;
            output += `   Password: ${data.password}\n`;
            output += `   Nombre: ${data.fullName}\n`;
        } else {
            output += `❌ NO ENCONTRADO: ${email}\n`;
        }
    }
    fs.writeFileSync('c:\\sistema-de-vigilancia\\seguridad\\check_emails_log.txt', output);
    console.log("Log saved.");
}

checkEmails();
