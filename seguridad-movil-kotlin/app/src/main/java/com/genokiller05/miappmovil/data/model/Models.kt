package com.genokiller05.miappmovil.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Guard(
    val id: String? = null,
    val idEmpleado: String = "",
    val nombre: String = "",
    val full_name: String? = null,
    val document_id: String? = null,
    val email: String = "",
    val area: String? = null,
    val foto: String? = null,
    val photo_url: String? = null,
    val estado: String? = null,
    val telefono: String? = null,
    val phone: String? = null,
    val direccion: String? = null,
    val created_at: String? = null,
    val fechaContratacion: String? = null,
    val actividades: kotlinx.serialization.json.JsonArray? = null,
    val site_id: String? = null,
    val is_active: Boolean? = null
)

@Serializable
data class Site(
    val id: String,
    val name: String,
    val created_at: String? = null
)

@Serializable
data class Report(
    val id: String,
    val site_id: String? = null,
    val shift_id: String? = null,
    val report_type_id: Int? = null,
    val status_id: Int? = null,
    val priority_id: Int? = null,
    val location_id: String? = null,
    val gps_lat: Double? = null,
    val gps_lng: Double? = null,
    val short_description: String? = null,
    val created_at: String? = null,
    val closed_at: String? = null,
    val created_by_guard_id: String? = null
)

@Serializable
data class ReportInsert(
    val site_id: String? = null,
    val shift_id: String? = null,
    val report_type_id: Int? = null,
    val status_id: Int? = null,
    val priority_id: Int? = null,
    val location_id: String? = null,
    val gps_lat: Double? = null,
    val gps_lng: Double? = null,
    val short_description: String? = null,
    val created_by_guard_id: String? = null
)

@Serializable
data class AppNotification(
    val id: String,
    @SerialName("user_id") val userId: String,
    val message: String,
    val type: String = "assignment",
    val status: String = "pending",
    @SerialName("site_id") val siteId: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("acknowledged_at") val acknowledgedAt: String? = null
)

@Serializable
data class EntryExit(
    val id: String,
    val fechaHora: String,
    val tipo: String,
    val descripcion: String,
    val idRelacionado: String? = null,
    val site_id: String? = null
)

@Serializable
data class WeeklyReport(
    val id: String,
    val start_date: String,
    val created_at: String,
    val admin_notes: String? = null,
    val summary_json: SummaryJson? = null
)

@Serializable
data class SummaryJson(
    val total_reports: Int? = null,
    val hottest_area: String? = null,
    val busiest_slot: String? = null,
    val status_counts: StatusCounts? = null
)

@Serializable
data class StatusCounts(
    val completed: Int? = null,
    val in_process: Int? = null,
    val pending: Int? = null
)

@Serializable
data class Evidence(
    val id: String? = null,
    val evidence_type_id: Int? = null,
    val storage_path: String? = null,
    val created_by_user_id: String? = null,
    val mime_type: String? = null
)

data class IncidentType(
    val id: Int,
    val name: String,
    val code: String
)

data class ReportStatus(
    val id: Int,
    val name: String,
    val code: String
)

data class Priority(
    val id: Int,
    val name: String,
    val code: String
)
