import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
