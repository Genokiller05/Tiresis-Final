const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function debug() {
  console.log('--- Supabase Debug ---');
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .limit(1);

  if (error) {
    if (error.code === '42P01') {
      console.error('ERROR: The "notifications" table does NOT exist.');
    } else {
      console.error('ERROR selecting from notifications:', error);
    }
  } else {
    console.log('SUCCESS: The "notifications" table exists.');
  }

  // Check if guards table exists
  const { data: gData, error: gError } = await supabase
    .from('guards')
    .select('idEmpleado')
    .limit(1);

  if (gError) {
    console.error('ERROR selecting from guards:', gError);
  } else {
    console.log('SUCCESS: The "guards" table exists.');
  }
}

debug();
