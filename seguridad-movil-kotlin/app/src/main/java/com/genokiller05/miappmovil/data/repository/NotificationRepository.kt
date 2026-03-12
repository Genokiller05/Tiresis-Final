package com.genokiller05.miappmovil.data.repository

import com.genokiller05.miappmovil.data.model.GuardNotification
import com.genokiller05.miappmovil.data.remote.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.realtime.realtime
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.PostgresAction
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.mapNotNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepository @Inject constructor() {

    private val supabase = SupabaseClient.client

    suspend fun fetchNotifications(guardId: String): List<GuardNotification> {
        return try {
            supabase.postgrest.from("guard_notifications")
                .select {
                    filter { eq("guard_id", guardId) }
                    order("created_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
                }
                .decodeList<GuardNotification>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun getUnreadCount(guardId: String): Int {
        return try {
            val response = supabase.postgrest.from("guard_notifications")
                .select {
                    filter {
                        eq("guard_id", guardId)
                        eq("is_read", false)
                    }
                    count(io.github.jan.supabase.postgrest.query.Count.EXACT)
                }
            response.countOrNull()?.toInt() ?: 0
        } catch (e: Exception) {
            0
        }
    }

    suspend fun markAsRead(notificationId: String) {
        try {
            supabase.postgrest.from("guard_notifications")
                .update(buildJsonObject { put("is_read", true) }) {
                    filter { eq("id", notificationId) }
                }
        } catch (e: Exception) {
            // ignore
        }
    }

    suspend fun markAllAsRead(guardId: String) {
        try {
            supabase.postgrest.from("guard_notifications")
                .update(buildJsonObject { put("is_read", true) }) {
                    filter {
                        eq("guard_id", guardId)
                        eq("is_read", false)
                    }
                }
        } catch (e: Exception) {
            // ignore
        }
    }
}
