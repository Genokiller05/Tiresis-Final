const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking columns for "buildings" table...');

    // Use an RPC-like query to get table information from information_schema
    // Actually, we can just try to insert a blank record and see the error or use a lucky select

    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'buildings' });

    if (error) {
        console.log('RPC failed, trying fallback...');
        const { data: cols, error: errCols } = await supabase.from('buildings').select('*').limit(0);
        if (errCols) {
            console.error('Select failed:', errCols.message);
        } else {
            // Note: select logic doesn't easily show columns if empty, but we can try to guess from the error of a bad insert
            console.log('Select succeeded but no data to show columns.');
        }
    } else {
        console.log('Columns:', data);
    }

    // Definitive test: try to insert with and without 'type'
    console.log('\nTest 1: Insert WITH "type" field...');
    const test1 = { id: 'test-type-' + Date.now(), name: 'Test', geometry: [], site_id: '7028686b-0b3c-451c-a304-48dfe225b551', type: 'custom' };
    const { error: err1 } = await supabase.from('buildings').insert([test1]);
    if (err1) console.log('Test 1 Result: FAILED -', err1.message);
    else {
        console.log('Test 1 Result: SUCCESS');
        await supabase.from('buildings').delete().eq('id', test1.id);
    }

    console.log('\nTest 2: Insert WITHOUT "type" field...');
    const { type, ...test2Data } = test1;
    test2Data.id = 'test-notype-' + Date.now();
    const { error: err2 } = await supabase.from('buildings').insert([test2Data]);
    if (err2) console.log('Test 2 Result: FAILED -', err2.message);
    else {
        console.log('Test 2 Result: SUCCESS');
        await supabase.from('buildings').delete().eq('id', test2Data.id);
    }
}

checkColumns();
