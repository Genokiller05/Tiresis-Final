import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vlxfhhmruwafetcxtqti.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rbcmw3T7_laKcoo9LcW1eQ_CQb4Bv48';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
