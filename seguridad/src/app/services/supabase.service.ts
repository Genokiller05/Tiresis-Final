import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NSjbMGGFrJYYtMhCPXUOhw_NkqzT6sK';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false, // Prevents internal storage sync/NavigatorLock issues
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
