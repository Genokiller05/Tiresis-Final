package com.genokiller05.miappmovil.data.repository

import com.genokiller05.miappmovil.data.model.AppNotification
import com.genokiller05.miappmovil.data.remote.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.PostgresAction
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.mapNotNull
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton

private val lenientJson = Json { ignoreUnknownKeys = true; isLenient = true }

@Singleton
class NotificationRepository @Inject constructor() {

    private val supabase = SupabaseClient.client
    private val TABLE = "notifications"
    private val channels = ConcurrentHashMap<String, io.github.jan.supabase.realtime.RealtimeChannel>()

    private fun getOrCreateChannel(userId: String): io.github.jan.supabase.realtime.RealtimeChannel {
        return channels.getOrPut(userId) {
            supabase.channel("notifications-$userId")
        }
    }

    /** Fetch all past notifications for this guard from Supabase. */
    suspend fun fetchNotifications(userId: String): List<AppNotification> {
        return try {
            supabase.postgrest.from(TABLE)
                .select {
                    filter { eq("user_id", userId) }
                    order("created_at", Order.DESCENDING)
                }
                .decodeList<AppNotification>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    /** Mark a single notification as acknowledged. */
    suspend fun acknowledge(notificationId: String) {
        try {
            supabase.postgrest.from(TABLE)
                .update(buildJsonObject { put("status", "acknowledged") }) {
                    filter { eq("id", notificationId) }
                }
        } catch (e: Exception) { /* ignore */ }
    }

    /** Mark all pending notifications for this user as acknowledged. */
    suspend fun acknowledgeAll(userId: String) {
        try {
            supabase.postgrest.from(TABLE)
                .update(buildJsonObject { put("status", "acknowledged") }) {
                    filter {
                        eq("user_id", userId)
                        eq("status", "pending")
                    }
                }
        } catch (e: Exception) { /* ignore */ }
    }

    /**
     * Returns a Flow that emits every new AppNotification inserted for the given [userId].
     * Listens to ALL inserts on the table and filters client-side by user_id.
     * Decodes directly from the Realtime action record — no extra network call.
     */
    fun listenForNewNotifications(userId: String): Flow<AppNotification> {
        val channel = getOrCreateChannel(userId)
        return channel
            .postgresChangeFlow<PostgresAction.Insert>(schema = "public") {
                table = TABLE
            }
            .mapNotNull { action ->
                try {
                    val record: JsonObject = action.record
                    // Client-side filter — only process rows meant for this user
                    val recordUserId = record["user_id"]?.jsonPrimitive?.content
                        ?: return@mapNotNull null
                    if (recordUserId != userId) return@mapNotNull null
                    // Decode directly from the JSON payload
                    lenientJson.decodeFromJsonElement(AppNotification.serializer(), record)
                } catch (e: Exception) { null }
            }
    }

    /** Subscribe the Realtime channel for [userId]. Call once after login. */
    suspend fun subscribeChannel(userId: String) {
        try {
            getOrCreateChannel(userId).subscribe()
        } catch (e: Exception) { /* ignore */ }
    }

    /** Unsubscribe the Realtime channel for [userId]. Call on logout. */
    suspend fun unsubscribeChannel(userId: String) {
        try {
            channels.remove(userId)?.unsubscribe()
        } catch (e: Exception) { /* ignore */ }
    }
}
