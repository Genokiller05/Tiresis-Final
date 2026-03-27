const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTests() {
    console.log("=== INICIANDO PRUEBAS DE INSERCIÓN ===");

    // 1. Guardar un Guardia
    const uniqueId = "TEST-" + Math.floor(Math.random() * 1000000);
    const testGuard = {
        idEmpleado: uniqueId,
        nombre: "Guardia Automático de Pruebas",
        email: `prueba_${uniqueId}@seguridad.com`,
        estado: "En servicio",
        area: "Zona Norte"
    };

    console.log("\n[1] Registrando Guardia...");
    const { data: guardData, error: guardError } = await supabase
        .from('guards')
        .insert([testGuard])
        .select()
        .single();

    if (guardError) {
        console.error("❌ Error al registrar guardia:", guardError);
        return;
    }
    console.log("✅ Guardia registrado:", guardData.nombre, " | ID Empleado:", guardData.idEmpleado);
    
    // Identificador para relaciones
    // Algunas tablas usan uid/uuid, en base local parece que is guardData.id o document_id (depends on schema)
    // El frontend móvil usa guardId = user?.id ?: user?.document_id ?: user?.idEmpleado
    const guardId = guardData.id || guardData.document_id || guardData.idEmpleado;

    // 2. Reportes por cada tipo de incidente (1 al 8)
    console.log("\n[2] Generando Reportes por tipo de incidente...");
    const incidentTypes = [
        { id: 1, name: "Robo / Hurto" },
        { id: 2, name: "Vandalismo" },
        { id: 3, name: "Acceso no autorizado" },
        { id: 4, name: "Emergencia médica" },
        { id: 41, name: "Incendio" },
        { id: 42, name: "Inundación" },
        { id: 43, name: "Falla eléctrica" },
        { id: 44, name: "Otro" }
    ];

    let reportesExitosos = 0;
    for (const incident of incidentTypes) {
        const report = {
            report_type_id: incident.id,
            status_id: 1, // Nuevo
            priority_id: 2, // Media
            short_description: `Prueba automática de tipo: ${incident.name}`,
            created_by_guard_id: guardId,
            site_id: "11111111-1111-1111-1111-111111111111" // Edificio Central (Mock Site ID commonly used or null if not required)
        };
        const { error: repError } = await supabase.from('reports').insert([report]);
        
        if (repError) {
            console.error(`❌ Error en reporte ${incident.name}:`, repError.message);
        } else {
            reportesExitosos++;
        }
    }
    console.log(`✅ ${reportesExitosos}/${incidentTypes.length} Reportes creados con éxito.`);

    // 3. Entradas y salidas de cada tipo de servicio
    console.log("\n[3] Generando Entradas y Salidas de servicios...");
    const servicios = ["Mantenimiento", "Mensajería", "Sistemas", "Limpieza"];
    
    let accesosExitosos = 0;
    for (const servicio of servicios) {
        // Entrada
        const entrada = {
            id: crypto.randomUUID(),
            fechaHora: new Date().toISOString(),
            tipo: 'Entrada',
            descripcion: `Pase de ingreso para personal de ${servicio}`
        };
        const { error: errorEntrada } = await supabase.from('entries_exits').insert([entrada]);
        if (!errorEntrada) {
            accesosExitosos++;
        } else {
            console.error("❌ Error en Entrada:", errorEntrada.message || errorEntrada);
        }

        // Salida simulada (1 hora después)
        const fechaSalida = new Date();
        fechaSalida.setHours(fechaSalida.getHours() + 1);
        const salida = {
            id: crypto.randomUUID(),
            fechaHora: fechaSalida.toISOString(),
            tipo: 'Salida',
            descripcion: `Pase de salida para personal de ${servicio}`
        };
        const { error: errorSalida } = await supabase.from('entries_exits').insert([salida]);
        if (!errorSalida) {
            accesosExitosos++;
        } else {
            console.error("❌ Error en Salida:", errorSalida.message || errorSalida);
        }
    }
    console.log(`✅ ${accesosExitosos}/${servicios.length * 2} Accesos (Entrada/Salida) creados con éxito.`);
    
    console.log("\n=== PRUEBAS FINALIZADAS ===");
}

runTests();
