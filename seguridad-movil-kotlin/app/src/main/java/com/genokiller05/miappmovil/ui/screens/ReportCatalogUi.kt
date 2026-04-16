package com.genokiller05.miappmovil.ui.screens

import androidx.compose.ui.graphics.Color
import com.genokiller05.miappmovil.data.model.IncidentType
import com.genokiller05.miappmovil.data.model.ReportStatus
import com.genokiller05.miappmovil.ui.theme.StatusAmber
import com.genokiller05.miappmovil.ui.theme.StatusBlue
import com.genokiller05.miappmovil.ui.theme.StatusGray
import com.genokiller05.miappmovil.ui.theme.StatusGreen
import com.genokiller05.miappmovil.ui.theme.StatusRed

private val fallbackReportTypes = linkedMapOf(
    1 to "Incidente",
    2 to "Novedad",
    3 to "Rondín",
    4 to "Alerta recibida"
)

private val fallbackReportStatuses = linkedMapOf(
    1 to ("Pendiente" to StatusAmber),
    2 to ("En revisión" to StatusBlue),
    3 to ("Cerrado" to StatusGreen),
    4 to ("Cancelado" to StatusRed),
    5 to ("Suspendido" to StatusGray)
)

internal fun reportTypeName(reportTypeId: Int?, catalog: List<IncidentType>): String {
    val dynamicName = catalog.firstOrNull { it.id == reportTypeId }?.name
    return dynamicName ?: fallbackReportTypes[reportTypeId] ?: "Reporte"
}

internal fun reportStatusPresentation(
    statusId: Int?,
    catalog: List<ReportStatus>
): Pair<String, Color> {
    val dynamicStatus = catalog.firstOrNull { it.id == statusId }
    if (dynamicStatus != null) {
        return dynamicStatus.name to reportStatusColor(dynamicStatus.code)
    }

    return fallbackReportStatuses[statusId] ?: ("—" to StatusGray)
}

private fun reportStatusColor(code: String?): Color {
    return when (code?.trim()?.lowercase()) {
        "pending" -> StatusAmber
        "in_review", "in_process" -> StatusBlue
        "closed", "completed", "resolved" -> StatusGreen
        "cancelled", "canceled" -> StatusRed
        "suspended" -> StatusGray
        else -> StatusGray
    }
}
