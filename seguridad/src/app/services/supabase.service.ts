import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uklohjdookcdibmogivq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6dJSMP-j-Caj3KnLrgN2EQ_ud8MOqUp';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
