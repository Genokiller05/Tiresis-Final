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
    private val fallbackReporterProfileId = "00000000-0000-0000-0000-000000000000"
    private val fallbackReportTypes = listOf(
        IncidentType(1, "Incidente", "incident"),
        IncidentType(2, "Novedad", "novelty"),
        IncidentType(3, "Rondín", "patrol"),
        IncidentType(4, "Alerta recibida", "received_alert")
    )
    private val fallbackReportStatuses = listOf(
        ReportStatus(1, "Pendiente", "pending"),
        ReportStatus(2, "En revisión", "in_review"),
        ReportStatus(3, "Cerrado", "closed")
    )
    private val fallbackPriorities = listOf(
        Priority(1, "Baja", "low"),
        Priority(2, "Media", "medium"),
        Priority(3, "Alta", "high"),
        Priority(4, "Crítica", "critical")
    )

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

    suspend fun fetchReportTypes(): List<IncidentType> {
        return try {
            val types = supabase.postgrest.from("report_types")
                .select {
                    order("id", io.github.jan.supabase.postgrest.query.Order.ASCENDING)
                }
                .decodeList<IncidentType>()

            if (types.isNotEmpty()) types else fallbackReportTypes
        } catch (e: Exception) {
            fallbackReportTypes
        }
    }

    suspend fun fetchReportStatuses(): List<ReportStatus> {
        return try {
            val statuses = supabase.postgrest.from("report_statuses")
                .select {
                    order("id", io.github.jan.supabase.postgrest.query.Order.ASCENDING)
                }
                .decodeList<ReportStatus>()

            if (statuses.isNotEmpty()) statuses else fallbackReportStatuses
        } catch (e: Exception) {
            fallbackReportStatuses
        }
    }

    suspend fun fetchPriorities(): List<Priority> {
        return try {
            val priorities = supabase.postgrest.from("priorities")
                .select {
                    order("id", io.github.jan.supabase.postgrest.query.Order.ASCENDING)
                }
                .decodeList<Priority>()

            if (priorities.isNotEmpty()) priorities else fallbackPriorities
        } catch (e: Exception) {
            fallbackPriorities
        }
    }

    suspend fun createReport(reportData: ReportInsert): Report {
        return try {
            supabase.postgrest.from("reports")
                .insert(reportData) { select() }
                .decodeSingle<Report>()
        } catch (e: Exception) {
            // Some environments still have a broken FK pointing created_by_guard_id to profiles.
            // Retry with the known default profile so the guard can still submit the report.
            if (
                reportData.created_by_guard_id != null &&
                (
                    e.message?.contains("reports_created_by_guard_id_fkey", ignoreCase = true) == true ||
                    e.message?.contains("profiles", ignoreCase = true) == true
                )
            ) {
                val fallbackReport = reportData.copy(created_by_guard_id = fallbackReporterProfileId)
                supabase.postgrest.from("reports")
                    .insert(fallbackReport) { select() }
                    .decodeSingle<Report>()
            } else {
                throw e
            }
        }
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

    suspend fun updateGuardStatus(guard: Guard, status: String) {
        try {
            // Generar nuevo Log de Actividad
            val sdf = java.text.SimpleDateFormat("dd/MM/yyyy HH:mm", java.util.Locale.getDefault())
            val currentDate = sdf.format(java.util.Date())
            
            val newActivity = buildJsonObject {
                put("fechaHora", currentDate)
                put("tipo", if (status == "En servicio") "INICIO DE TURNO" else "FIN DE TURNO")
                put("descripcion", "El guardia " + (if (status == "En servicio") "inició" else "finalizó") + " su turno a las " + currentDate.split(" ")[1] + ".")
            }
            
            val currentActivities = guard.actividades?.toMutableList() ?: mutableListOf()
            currentActivities.add(0, newActivity) // Agregar al inicio de la lista
            val newActivitiesJsonArray = kotlinx.serialization.json.JsonArray(currentActivities)

            supabase.postgrest.from("guards")
                .update(buildJsonObject { 
                    put("estado", status) 
                    put("actividades", newActivitiesJsonArray)
                }) {
                    filter {
                        if (!guard.id.isNullOrEmpty()) {
                            eq("id", guard.id)
                        } else {
                            eq("idEmpleado", guard.idEmpleado)
                        }
                    }
                }
        } catch (e: Exception) {
            // Silently fail on network error, status update shouldn't crash app
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
