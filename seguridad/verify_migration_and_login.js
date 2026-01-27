const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLoginAndData() {
    console.log("--- Iniciando Prueba de Login y Datos ---");

    const testEmail = "tareacanto73@gmail.com";
    const testPassword = "ng451khe"; // De admins.json

    console.log(`Intentando login para: ${testEmail}`);

    // 1. Simular Login (Búsqueda por credenciales)
    const { data: user, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', testEmail)
        .eq('password', testPassword)
        .single();

    if (error || !user) {
        console.error("❌ FALLO DE LOGIN: Usuario no encontrado o contraseña incorrecta.");
        if (error) console.error("Error DB:", error.message);

        // Debug: Listar todos los usuarios para ver qué hay
        const { data: allAdmins } = await supabase.from('admins').select('email, password, fullName');
        console.log("\n--- DEBUG: Usuarios en BD ---");
        if (allAdmins && allAdmins.length > 0) {
            allAdmins.forEach(a => console.log(`Email: ${a.email} | Pass: ${a.password} | Name: ${a.fullName}`));
        } else {
            console.log("⚠️ La tabla 'admins' está VACÍA.");
        }
        return;
    }

    console.log("✅ LOGIN EXITOSO: Credenciales válidas.");

    // 2. Verificar Datos Guardados (Integridad)
    console.log("\n--- Verificando Integridad de Datos ---");

    // Datos esperados (del JSON original)
    const expected = {
        fullName: "ana ",
        companyName: "perro",
        location: "calle 3 por 4" // Mapeado de 'street'
    };

    let dataCorrect = true;

    if (user.fullName !== expected.fullName) {
        console.error(`❌ Nombre incorrecto. Esperado: '${expected.fullName}', Recibido: '${user.fullName}'`);
        dataCorrect = false;
    } else {
        console.log(`✅ Nombre correcto: ${user.fullName}`);
    }

    if (user.companyName !== expected.companyName) {
        console.error(`❌ Empresa incorrecta. Esperado: '${expected.companyName}', Recibido: '${user.companyName}'`);
        dataCorrect = false;
    } else {
        console.log(`✅ Empresa correcta: ${user.companyName}`);
    }

    if (user.location !== expected.location) {
        console.error(`❌ Ubicación incorrecta. Esperado: '${expected.location}', Recibido: '${user.location}'`);
        dataCorrect = false;
    } else {
        console.log(`✅ Ubicación correcta: ${user.location}`);
    }

    if (dataCorrect) {
        console.log("\n🏆 RESULTADO FINAL: El usuario migró perfectamente y puede hacer login.");
    } else {
        console.error("\n⚠️ RESULTADO FINAL: El login funciona, pero algunos datos no coinciden.");
    }
}

verifyLoginAndData();
