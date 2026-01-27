const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';
const supabase = createClient(supabaseUrl, supabaseKey);

const dataDir = path.join(__dirname, 'data');
const logFile = path.join(__dirname, 'migration_log.txt');

const log = (msg) => {
    console.log(msg);
    try {
        fs.appendFileSync(logFile, msg + '\n');
    } catch (e) {
        // ignore
    }
};

const readJson = (file) => {
    try {
        return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    } catch (e) {
        log(`Error reading ${file}: ${e.message}`);
        return [];
    }
};

async function migrate() {
    try {
        fs.writeFileSync(logFile, "--- INICIO MIGRACIÓN ---\n");
    } catch (e) { }

    log("--- Iniciando Migración de Usuarios ---");

    // 1. Migrar Admins
    const admins = readJson('admins.json');
    log(`Encontrados ${admins.length} administradores en JSON local.`);

    // Mapeo de datos para coincidir con schema DB
    const adminsToInsert = admins.map(a => ({
        fullName: a.fullName,
        email: a.email,
        password: a.password,
        companyName: a.companyName,
        location: a.street || a.location, // Mapear street a location
        lat: a.lat,
        lng: a.lng,
        zone: a.zone
    }));

    if (adminsToInsert.length > 0) {
        log(`Intentando insertar admins... ${adminsToInsert.length}`);
        const { data, error } = await supabase.from('admins').upsert(adminsToInsert, { onConflict: 'email' }).select();

        if (error) {
            log(`❌ Error migrando admins: ${error.message} - Hint: ${error.hint || ''} - Details: ${error.details || ''}`);
        } else {
            log(`✅ Admins migrados. Filas devueltas: ${data?.length}`);
            if (!data || data.length === 0) log("⚠️ Upsert exitoso pero no devolvió filas (posible bloqueo RLS silente).");
        }
    }

    // 2. Migrar Guardias
    const guards = readJson('guards.json');
    log(`Encontrados ${guards.length} guardias en JSON local.`);

    // La estructura de guards.json suele ser compatible directo, pero aseguramos
    const guardsToInsert = guards.map(g => ({
        idEmpleado: g.idEmpleado,
        nombre: g.nombre,
        email: g.email,
        telefono: g.telefono,
        direccion: g.direccion,
        foto: g.foto,
        area: g.area,
        estado: g.estado,
        lat: g.lat,
        lng: g.lng,
        actividades: g.actividades
    }));

    if (guardsToInsert.length > 0) {
        log(`Intentando insertar guardias... ${guardsToInsert.length}`);
        const { data, error } = await supabase.from('guards').upsert(guardsToInsert, { onConflict: 'idEmpleado' }).select();

        if (error) {
            log(`❌ Error migrando guardias: ${error.message}`);
        } else {
            log(`✅ Guardias migrados. Filas: ${data?.length}`);
            if (!data || data.length === 0) log("⚠️ Guardias: Upsert exitoso pero sin filas (RLS?).");
        }
    }

    log("--- Migración Finalizada ---");
}

migrate();
