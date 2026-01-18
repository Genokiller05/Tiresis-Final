import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient | null = null;

  constructor() { }

  get client(): SupabaseClient {
    if (!this.supabase) {
      // const supabaseUrl = 'https://uklohjdookcdibmogivq.supabase.co';
      // const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbG9oamRvb2tjZGlibW9naXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjA3ODUsImV4cCI6MjA4MDQzNjc4NX0.v36A-m0IeY_biE2y2K7N22Q1d48i2yGvMh2Z9bSk9L0';
      // this.supabase = createClient(supabaseUrl, supabaseKey);
      throw new Error('Supabase credentials are not configured.');
    }
    return this.supabase;
  }
}
