// Script to diagnose the actual schema of the reports table
import { supabase } from './lib/supabase';

async function diagnoseSchema() {
    console.log('=== Diagnosing Reports Table Schema ===\n');

    // Try to get any single row to see what columns exist
    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying reports:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Sample row from reports table:');
        console.log(JSON.stringify(data[0], null, 2));
        console.log('\nColumn names found:');
        console.log(Object.keys(data[0]));
    } else {
        console.log('No data found in reports table');

        // Try to create a test record to see what columns are expected
        console.log('\nAttempting to insert a test record with common column variations...');

        // Try snake_case
        const testRecordSnake = {
            fecha_hora: new Date().toISOString(),
            tipo: 'Test',
            origen: 'Test',
            sitio_area: 'Test',
            estado: 'Test',
            detalles: { descripcion: 'Test' }
        };

        const { error: insertError } = await supabase
            .from('reports')
            .insert([testRecordSnake])
            .select();

        if (insertError) {
            console.error('Snake_case insert error:', insertError);
        } else {
            console.log('✓ Snake_case column names work!');
        }
    }
}

diagnoseSchema();
