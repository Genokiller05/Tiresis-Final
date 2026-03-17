const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function enableRealtime() {
  console.log('Enabling Realtime for notifications table...');
  
  // This SQL enables realtime for the notifications table by adding it to the supabase_realtime publication
  const sql = `
    BEGIN;
      -- Check if publication exists, if not create it (standard in Supabase)
      -- But usually we just need to add the table to it
      -- If it fails, it might be because the user doesn't have permissions via service key for this specific command,
      -- but usually service key has enough power through RPC if defined.
      -- Since we don't have a direct SQL exec RPC, we'll try to use the 'exec_sql' if it exists.
    COMMIT;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: "alter publication supabase_realtime add table notifications;" 
    });
    
    if (error) {
        console.error('Error enabling realtime via RPC:', error);
        console.log('Attempting alternative method...');
        // If RPC fails, we can't do much about DDL via JS client usually,
        // unless there's a specific endpoint.
    } else {
        console.log('Realtime enabled successfully.');
    }
  } catch (err) {
    console.error('Exception enabling realtime:', err);
  }

  // Also verify counts
  const { count, error: countError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('Error checking notifications table:', countError);
  } else {
    console.log(`Current notifications count: ${count}`);
  }
}

enableRealtime();
