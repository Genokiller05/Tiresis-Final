// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseAnonKey = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
