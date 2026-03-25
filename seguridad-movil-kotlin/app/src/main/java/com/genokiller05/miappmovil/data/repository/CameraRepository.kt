package com.genokiller05.miappmovil.data.repository

import com.genokiller05.miappmovil.data.model.CameraFeed
import io.ktor.client.HttpClient
import io.ktor.client.engine.android.Android
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.statement.bodyAsText
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CameraRepository @Inject constructor() {
    private val client = HttpClient(Android)
    private val json = Json {
        ignoreUnknownKeys = true
    }

    suspend fun fetchCameras(siteId: String?): List<CameraFeed> {
        return try {
            val payload = client.get("http://10.0.2.2:3000/api/public/cameras") {
                if (!siteId.isNullOrBlank()) {
                    parameter("site_id", siteId)
                }
            }.bodyAsText()

            json.decodeFromString<List<CameraFeed>>(payload)
        } catch (e: Exception) {
            emptyList()
        }
    }
}
