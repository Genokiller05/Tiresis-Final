const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aGxicGFhYnlmb29tbmxra3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjU3MjAsImV4cCI6MjA4NDU0MTcyMH0.0E6oNSpArkYOsdxiGiSYAWmCyQxSkHWQ8DjXuBcTVZU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testReportTypes() {
    console.log("Iniciando prueba de diferentes tipos de reportes...\n");

    const tests = [
        { typeName: "Incidente", typeId: 1 },
        { typeName: "Novedad", typeId: 2 },
        { typeName: "Alerta recibida", typeId: 4 }
    ];

    for (const test of tests) {
        console.log(`⏳ Simulando creación de reporte tipo: ${test.typeName} (ID: ${test.typeId})`);

        const fakeReport = {
            site_id: "29e48d60-df1e-4b7c-91dc-184ca1ea2c3e", // Usando un site_id existente de pruebas previas
            report_type_id: test.typeId,
            status_id: 1, // Pendiente
            priority_id: 2, // Media
            short_description: `Area: Edificio Central | PRUEBA DE TIPO ${test.typeName.toUpperCase()} - Creado a las ${new Date().toLocaleTimeString()}`,
            created_by_guard_id: "a7fc32c3-56f5-4d68-ba57-43b5a2f17dd9", // Usando un guard_id existente
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('reports')
            .insert(fakeReport)
            .select()
            .single();

        if (error) {
            console.error(`❌ Error al crear reporte de ${test.typeName}:`, error.message);
        } else {
            console.log(`✅ Exitóso: Reporte de ${test.typeName} guardado con ID: ${data.id}`);
            // Verificación para asegurar que el ID enviado es igual al ID almacenado
            if (data.report_type_id === test.typeId) {
                console.log(`   └─ Correcto: El report_type_id se mantuvo como: ${data.report_type_id}`);
            } else {
                console.error(`   └─ ¡Error en base de datos!: Se envió ${test.typeId} pero se grabó ${data.report_type_id}`);
            }
        }
        console.log("--------------------------------------------------\n");
    }

    console.log("✅ Prueba finalizada. Revisa el Dashboard Web para verlos aparecer en tiempo real.");
}

testReportTypes();
