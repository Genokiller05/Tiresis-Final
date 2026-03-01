// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aGxicGFhYnlmb29tbmxra3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjU3MjAsImV4cCI6MjA4NDU0MTcyMH0.0E6oNSpArkYOsdxiGiSYAWmCyQxSkHWQ8DjXuBcTVZU';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

