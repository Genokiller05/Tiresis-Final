package com.genokiller05.miappmovil.data.repository

import com.genokiller05.miappmovil.data.model.*
import com.genokiller05.miappmovil.data.remote.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.storage.storage
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.JsonObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DataRepository @Inject constructor() {

    private val supabase = SupabaseClient.client

    suspend fun fetchSites(): List<Site> {
        return try {
            supabase.postgrest.from("sites").select().decodeList<Site>()
        } catch (e: Exception) {
            // Fallback mock data matching original
            listOf(
                Site("11111111-1111-1111-1111-111111111111", "Edificio Central"),
                Site("22222222-2222-2222-2222-222222222222", "Área Deportiva"),
                Site("33333333-3333-3333-3333-333333333333", "Entrada Principal"),
                Site("44444444-4444-4444-4444-444444444444", "Sitio General")
            )
        }
    }

    suspend fun createReport(reportData: ReportInsert): Report {
        return supabase.postgrest.from("reports")
            .insert(reportData) { select() }
            .decodeSingle<Report>()
    }

    suspend fun fetchReports(): List<Report> {
        return supabase.postgrest.from("reports")
            .select {
                order("created_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
            }
            .decodeList<Report>()
    }

    suspend fun getReportById(id: String): Report? {
        return try {
            supabase.postgrest.from("reports")
                .select {
                    filter { eq("id", id) }
                }
                .decodeSingle<Report>()
        } catch (e: Exception) {
            null
        }
    }

    suspend fun createEntryExit(entryData: EntryExit) {
        supabase.postgrest.from("entries_exits").insert(entryData)
    }

    suspend fun updateGuardStatus(idEmpleado: String, status: String) {
        supabase.postgrest.from("guards")
            .update(buildJsonObject { put("estado", status) }) {
                filter { eq("idEmpleado", idEmpleado) }
            }
    }

    suspend fun loginByEmail(email: String): Guard? {
        return try {
            supabase.postgrest.from("guards")
                .select {
                    filter { eq("email", email.trim().lowercase()) }
                }
                .decodeSingle<Guard>()
        } catch (e: Exception) {
            null
        }
    }

    suspend fun uploadEntryEvidence(imageBytes: ByteArray, userId: String): Pair<String?, String?> {
        return try {
            val filename = "evidence/${System.currentTimeMillis()}_${(Math.random() * 1000000).toInt()}.jpg"
            supabase.storage.from("evidence").upload(filename, imageBytes) {
                upsert = false
            }

            // Create evidence record
            val evidenceData = buildJsonObject {
                put("evidence_type_id", 1)
                put("storage_path", filename)
                put("created_by_user_id", userId)
                put("mime_type", "image/jpeg")
            }
            val result = try {
                supabase.postgrest.from("evidences")
                    .insert(evidenceData) { select() }
                    .decodeSingle<Evidence>()
            } catch (e: Exception) {
                null
            }

            val publicUrl = supabase.storage.from("evidence").publicUrl(filename)
            Pair(result?.id ?: "temp-evidence-id", publicUrl)
        } catch (e: Exception) {
            Pair(null, null)
        }
    }

    suspend fun linkEvidenceToReport(reportId: String, evidenceId: String) {
        try {
            supabase.postgrest.from("report_evidences")
                .insert(buildJsonObject {
                    put("report_id", reportId)
                    put("evidence_id", evidenceId)
                })
        } catch (e: Exception) {
            // Silently fail as in original
        }
    }

    suspend fun fetchReportEvidences(reportId: String): List<String> {
        return try {
            // 1. Get evidence IDs from report_evidences
            val links = supabase.postgrest.from("report_evidences")
                .select { filter { eq("report_id", reportId) } }
                .decodeList<JsonObject>()

            val evidenceUrls = mutableListOf<String>()
            
            // 2. For each evidence ID, get the evidence record to find the storage path
            for (link in links) {
                val evidenceId = link["evidence_id"]?.jsonPrimitive?.content ?: continue
                try {
                    val evidence = supabase.postgrest.from("evidences")
                        .select { filter { eq("id", evidenceId) } }
                        .decodeSingle<Evidence>()
                        
                    evidence.storage_path?.let { path ->
                        val url = supabase.storage.from("evidence").publicUrl(path)
                        evidenceUrls.add(url)
                    }
                } catch (e: Exception) {
                    // Skip if evidence record not found
                }
            }
            evidenceUrls
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun fetchWeeklyReports(): List<WeeklyReport> {
        return try {
            supabase.postgrest.from("weekly_reports")
                .select {
                    order("created_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
                }
                .decodeList<WeeklyReport>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun fetchEntriesExits(fromDate: String, toDate: String): List<EntryExit> {
        return try {
            supabase.postgrest.from("entries_exits")
                .select {
                    filter {
                        gte("fechaHora", "${fromDate}T00:00:00")
                        lte("fechaHora", "${toDate}T23:59:59")
                    }
                    order("fechaHora", io.github.jan.supabase.postgrest.query.Order.ASCENDING)
                }
                .decodeList<EntryExit>()
        } catch (e: Exception) {
            emptyList()
        }
    }
}
