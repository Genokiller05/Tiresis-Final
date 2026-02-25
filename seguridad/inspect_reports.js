const { supabase } = require('./supabaseClient');

async function inspectTable() {
    console.log("--- Inspeccionando tabla 'reports' ---");

    // Intenta seleccionar todo para ver qué columnas devuelve
    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error al hacer select *:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Columnas encontradas en la primera fila:", Object.keys(data[0]));
        } else {
            console.log("La tabla 'reports' existe pero está vacía. No puedo deducir columnas dinámicamente sin insertar.");
            // Intentar insertar un dummy para ver errores de columnas si fallara, pero mejor solo reportar.
        }
    }
}

inspectTable();
