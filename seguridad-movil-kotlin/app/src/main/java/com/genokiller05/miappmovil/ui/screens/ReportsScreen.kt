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
import androidx.hilt.navigation.compose.hiltViewModel
import com.genokiller05.miappmovil.R
import com.genokiller05.miappmovil.data.model.Report
import com.genokiller05.miappmovil.data.repository.DataRepository
import com.genokiller05.miappmovil.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ReportsScreen(
    onNavigateToNewReport: () -> Unit,
    onNavigateToReportDetail: (String) -> Unit
) {
    val colors = AppTheme.colors
    var reports by remember { mutableStateOf<List<Report>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    val repo = remember { DataRepository() }

    LaunchedEffect(Unit) {
        while(true) {
            reports = repo.fetchReports()
            isLoading = false
            delay(5000) // 5 second polling matching simulated realtime
        }
    }

    val statusNames = mapOf(
        1 to Pair("Pendiente", StatusAmber),
        2 to Pair("En proceso", StatusBlue),
        3 to Pair("Completado", StatusGreen),
        4 to Pair("Cancelado", StatusRed),
        5 to Pair("Suspendido", StatusGray)
    )

    val typeNames = mapOf(
        1 to "Robo / Hurto",
        2 to "Vandalismo",
        3 to "Acceso no autorizado",
        4 to "Emergencia médica",
        5 to "Incendio",
        6 to "Inundación",
        7 to "Falla eléctrica",
        8 to "Otro"
    )

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
                        val (statusText, statusColor) = statusNames[report.status_id] ?: Pair("—", StatusGray)
                        val typeName = typeNames[report.report_type_id] ?: "Reporte"

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
