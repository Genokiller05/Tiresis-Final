require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncPlanColumn() {
    console.log('--- Iniciando Sincronización de Planes ---');

    // 1. Actualizar Supabase (SQL)
    console.log('1. Agregando columna "plan" a Supabase...');
    // Intentaremos hacer un query simple para ver si falla al referenciar 'plan'
    const { error: checkError } = await supabase.from('admins').select('plan').limit(1);
    
    if (checkError && checkError.code === '42703') { // Undefined column
        console.log('   -> La columna "plan" no existe. Debes ejecutar esto en el SQL Editor de Supabase:');
        console.log('\n   ALTER TABLE admins ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT \'Básico\';\n');
        console.log('   (Intentaré crearla vía RPC si está disponible...)');
        
        // Intentar vía RPC si existe un ejecutor de SQL genérico (poco común pero posible)
        const { error: rpcError } = await supabase.rpc('execute_sql', { sql_query: 'ALTER TABLE admins ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT \'Básico\';' });
        if (rpcError) {
          console.warn('   -> No se pudo crear vía RPC (esto es normal si no hay rpc configurado).');
        } else {
          console.log('   -> ✅ Columna creada exitosamente vía RPC.');
        }
    } else if (!checkError) {
        console.log('   -> ✅ La columna "plan" ya existe en Supabase.');
    } else {
        console.error('   -> Error inesperado:', checkError.message);
    }

    // 2. Actualizar admins.json (Local)
    console.log('2. Actualizando admins.json local...');
    const adminsPath = path.join(__dirname, 'data', 'admins.json');
    if (fs.existsSync(adminsPath)) {
        try {
            const admins = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
            const updatedAdmins = admins.map(admin => ({
                ...admin,
                plan: admin.plan || 'Básico'
            }));
            fs.writeFileSync(adminsPath, JSON.stringify(updatedAdmins, null, 2));
            console.log('   -> ✅ admins.json actualizado con éxito.');
        } catch (err) {
            console.error('   -> Error al actualizar admins.json:', err.message);
        }
    } else {
        console.log('   -> admins.json no encontrado, se creará en el primer registro.');
    }

    console.log('--- Sincronización Finalizada ---');
}

syncPlanColumn();
