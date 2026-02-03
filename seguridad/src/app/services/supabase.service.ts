import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vlxfhhmruwafetcxtqti.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rbcmw3T7_laKcoo9LcW1eQ_CQb4Bv48';

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
