const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function verifyAllExits() {
    console.log('--- TEST DE VERIFICACIÓN DE SALIDAS ---');

    const test1 = {
        id: generateUUID(),
        fechaHora: new Date().toISOString(),
        tipo: 'Salida',
        descripcion: `Nombre: Visitante de Prueba. Visita a: Test 101`,
        idRelacionado: null,
    };

    const test2 = {
        id: generateUUID(),
        fechaHora: new Date().toISOString(),
        tipo: 'Salida',
        descripcion: `Nombre: Repartidor de Prueba. Paquetería: Amazon - Paquete`,
        idRelacionado: null,
    };

    const test3 = {
        id: generateUUID(),
        fechaHora: new Date().toISOString(),
        tipo: 'Salida',
        descripcion: `Nombre: Servicio de Prueba. Trabajador: Mantenimiento S.A. - Luces`,
        idRelacionado: null,
    };

    for (const t of [test1, test2, test3]) {
        const { data, error } = await supabase.from('entries_exits').insert([t]).select().single();
        if (error) console.error(`[ERROR] en ${t.descripcion}:`, error.message);
        else console.log(`[ÉXITO] Guardado correctamente como SALIDA en la BD: ${data.descripcion}`);
    }
}

verifyAllExits();
