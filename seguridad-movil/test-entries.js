const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testEntriesExits() {
    console.log('Testing Entries Exits Table...');

    // 1. Check existing structure
    const { data: schemaData, error: schemaError } = await supabase
        .from('entries_exits')
        .select('*')
        .limit(1);

    if (schemaError) {
        console.error('Error fetching entries_exits schema/data:', schemaError);
    } else {
        console.log('Sample row from entries_exits:', schemaData[0]);
    }

    // 2. Test inserting a visitor (without categoria column first)
    const testVisitor = {
        fechaHora: new Date().toISOString(),
        tipo: 'Entrada',
        descripcion: 'Nombre: Test Visitor. Visita a: Depto 101',
    };

    let { data: insertData, error: insertError } = await supabase
        .from('entries_exits')
        .insert([testVisitor])
        .select()
        .single();

    if (insertError) {
        console.error('Error inserting test visitor (default):', insertError);
    } else {
        console.log('Successfully inserted test visitor (default):', insertData);
    }

    // 3. Test inserting with categoria = 'visit'
    const testVisitorCat = {
        ...testVisitor,
        categoria: 'visit',
    };

    const { data: insertDataCat, error: insertErrorCat } = await supabase
        .from('entries_exits')
        .insert([testVisitorCat])
        .select()
        .single();

    if (insertErrorCat) {
        console.error('Error inserting test visitor with categoria:', insertErrorCat);
    } else {
        console.log('Successfully inserted test visitor with categoria:', insertDataCat);
    }
}

testEntriesExits();
