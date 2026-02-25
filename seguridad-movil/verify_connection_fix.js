const { createClient } = require('@supabase/supabase-js');
// require('react-native-url-polyfill/auto'); // Comentado para prueba en node puro

// Credenciales NUEVAS y CORRECTAS
const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseAnonKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyConnection() {
    console.log('=== Verificando Conexión Supabase (Credenciales Nuevas) ===\n');

    // 1. Probar conexión básica (Lista de guards)
    console.log('Intentando leer tabla "guards"...');
    const { data: guards, error: guardsError } = await supabase
        .from('guards')
        .select('*')
        .limit(5);

    if (guardsError) {
        console.error('❌ Error CRÍTICO conectando a tabla guards:', guardsError.message);
        console.error('Detalle:', guardsError);
    } else {
        console.log(`✅ Conexión exitosa. Se encontraron ${guards.length} guardias.`);
        if (guards.length > 0) {
            console.log('   Ejemplo:', guards[0].email, '-', guards[0].nombre);
        } else {
            console.warn('   ⚠️ La tabla existe pero está vacía.');
        }
    }

    // 2. Simular Login (Búsqueda por email)
    const testEmail = 'juan.perez@segcdmx.mx'; // Correo de prueba real
    console.log(`\nSimulando Login para email: "${testEmail}"...`);

    const { data: user, error: loginError } = await supabase
        .from('guards')
        .select('*')
        .eq('email', testEmail)
        .single();

    if (loginError) {
        console.log('❌ Login fallido (esperado si no has corrido el script SQL aún):', loginError.message);
    } else {
        console.log('✅ Login exitoso. Usuario encontrado:', user.nombre);
    }

    console.log('\n=== Fin de Verificación ===');
}

verifyConnection();
