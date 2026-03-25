package com.genokiller05.miappmovil.data.remote

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.realtime.Realtime

object SupabaseClient {
    private const val SUPABASE_URL = "https://uwhlbpaabyfoomnlkktt.supabase.co"
    private const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aGxicGFhYnlmb29tbmxra3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjU3MjAsImV4cCI6MjA4NDU0MTcyMH0.0E6oNSpArkYOsdxiGiSYAWmCyQxSkHWQ8DjXuBcTVZU"

    val client = createSupabaseClient(
        supabaseUrl = SUPABASE_URL,
        supabaseKey = SUPABASE_ANON_KEY
    ) {
        install(Postgrest)
        install(Storage)
        install(Realtime) {
            connectOnSubscribe = true
        }
    }
}
