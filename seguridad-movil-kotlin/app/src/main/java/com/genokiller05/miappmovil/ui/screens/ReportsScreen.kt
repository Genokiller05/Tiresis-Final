package com.genokiller05.miappmovil.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.genokiller05.miappmovil.data.model.IncidentType
import com.genokiller05.miappmovil.R
import com.genokiller05.miappmovil.data.model.Report
import com.genokiller05.miappmovil.data.model.ReportStatus
import com.genokiller05.miappmovil.data.repository.DataRepository
import com.genokiller05.miappmovil.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun ReportsScreen(
    onNavigateToNewReport: () -> Unit,
    onNavigateToReportDetail: (String) -> Unit
) {
    val colors = AppTheme.colors
    var reports by remember { mutableStateOf<List<Report>>(emptyList()) }
    var reportTypes by remember { mutableStateOf<List<IncidentType>>(emptyList()) }
    var reportStatuses by remember { mutableStateOf<List<ReportStatus>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val repo = remember { DataRepository() }

    LaunchedEffect(Unit) {
        reportTypes = repo.fetchReportTypes()
        reportStatuses = repo.fetchReportStatuses()

        while(true) {
            reports = repo.fetchReports()
            isLoading = false
            delay(5000) // 5 second polling matching simulated realtime
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
    ) {
        Column {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = stringResource(R.string.reports_management_title),
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.text
                )
            }

            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = colors.accent)
                }
            } else if (reports.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Outlined.Description,
                            contentDescription = null,
                            tint = colors.subtext,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("No hay reportes", color = colors.subtext)
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(reports) { report ->
                        val (statusText, statusColor) = reportStatusPresentation(report.status_id, reportStatuses)
                        val typeName = reportTypeName(report.report_type_id, reportTypes)

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onNavigateToReportDetail(report.id) },
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = colors.card),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = typeName,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 16.sp,
                                        color = colors.text,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(20.dp))
                                            .background(statusColor.copy(alpha = 0.15f))
                                            .padding(horizontal = 10.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = statusText,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = statusColor
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                val reportDesc = report.short_description ?: stringResource(R.string.general_no_description)
                                val cleanedDesc = reportDesc.replace(Regex("Evidencia: (http[s]?://[^\\s|]+)"), "").replace("| |", "|").trimEnd('|', ' ').trim()

                                Text(
                                    text = cleanedDesc,
                                    color = colors.subtext,
                                    fontSize = 14.sp,
                                    maxLines = 2
                                )

                                Spacer(modifier = Modifier.height(6.dp))

                                Text(
                                    text = report.created_at?.take(10) ?: "",
                                    fontSize = 12.sp,
                                    color = colors.subtext.copy(alpha = 0.7f)
                                )
                            }
                        }
                    }
                }
            }
        }

        // FAB
        FloatingActionButton(
            onClick = onNavigateToNewReport,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(20.dp),
            containerColor = colors.accent,
            contentColor = DarkBackground
        ) {
            Icon(Icons.Outlined.Add, contentDescription = "Nuevo Reporte")
        }
    }
}
