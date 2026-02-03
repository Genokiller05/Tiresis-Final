// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vlxfhhmruwafetcxtqti.supabase.co';
const supabaseAnonKey = 'sb_publishable_rbcmw3T7_laKcoo9LcW1eQ_CQb4Bv48';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
