package com.genokiller05.miappmovil.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.genokiller05.miappmovil.R
import com.genokiller05.miappmovil.data.model.Report
import com.genokiller05.miappmovil.data.repository.DataRepository
import com.genokiller05.miappmovil.ui.theme.*
import coil.compose.AsyncImage
import androidx.compose.ui.layout.ContentScale
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportDetailScreen(
    reportId: String,
    onBack: () -> Unit
) {
    val colors = AppTheme.colors
    var report by remember { mutableStateOf<Report?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    val repo = remember { DataRepository() }

    val statusNames = mapOf(
        1 to Pair("Pendiente", StatusAmber),
        2 to Pair("En proceso", StatusBlue),
        3 to Pair("Completado", StatusGreen),
        4 to Pair("Cancelado", StatusRed)
    )

    val typeNames = mapOf(
        1 to "Robo / Hurto", 2 to "Vandalismo", 3 to "Acceso no autorizado",
        4 to "Emergencia médica", 5 to "Incendio", 6 to "Inundación",
        7 to "Falla eléctrica", 8 to "Otro"
    )

    LaunchedEffect(reportId) {
        while(true) {
            report = repo.getReportById(reportId)
            isLoading = false
            delay(5000) // Poll every 5s for realtime emulation
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.report_detail_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Outlined.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = colors.background,
                    titleContentColor = colors.text,
                    navigationIconContentColor = colors.text
                )
            )
        },
        containerColor = colors.background
    ) { padding ->
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = colors.accent)
            }
        } else if (report == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Text(stringResource(R.string.report_detail_not_found), color = colors.subtext)
            }
        } else {
            val r = report!!
            val (statusText, statusColor) = statusNames[r.status_id] ?: Pair("—", StatusGray)
            val typeName = typeNames[r.report_type_id] ?: "—"
            
            var descriptionText = r.short_description ?: stringResource(R.string.general_no_description)
            var evidenceUri: String? = null
            
            // Extraer Evidencia de la descripción
            val evidenceRegex = Regex("Evidencia: (http[s]?://[^\\s|]+)")
            val matchResult = evidenceRegex.find(descriptionText)
            if (matchResult != null) {
                evidenceUri = matchResult.groupValues[1]
                descriptionText = descriptionText.replace(matchResult.value, "").trim()
            }
            // Limpiar separadores vacíos
            if (descriptionText.endsWith("|")) {
                descriptionText = descriptionText.dropLast(1).trim()
            }

            Column(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp)
            ) {
                // Status badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(statusColor.copy(alpha = 0.15f))
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text(statusText, fontWeight = FontWeight.Bold, color = statusColor, fontSize = 14.sp)
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Detail Cards
                DetailRow(icon = Icons.Outlined.Tag, label = stringResource(R.string.report_detail_id), value = r.id.take(8), colors = colors)
                DetailRow(icon = Icons.Outlined.Category, label = stringResource(R.string.report_detail_type), value = typeName, colors = colors)
                DetailRow(icon = Icons.Outlined.CalendarToday, label = stringResource(R.string.report_detail_date), value = r.created_at?.take(10) ?: "—", colors = colors)

                Spacer(modifier = Modifier.height(16.dp))

                // Description
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.card)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = stringResource(R.string.report_detail_summary),
                            fontWeight = FontWeight.Bold,
                            color = colors.text,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        Text(
                            text = descriptionText,
                            fontSize = 14.sp,
                            color = colors.subtext,
                            lineHeight = 22.sp
                        )
                    }
                }

                if (evidenceUri != null) {
                    Spacer(modifier = Modifier.height(20.dp))
                    Text(
                        text = "Evidencia Adjunta",
                        fontWeight = FontWeight.Bold,
                        color = colors.text,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Card(
                        modifier = Modifier.fillMaxWidth().height(250.dp),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        AsyncImage(
                            model = evidenceUri,
                            contentDescription = "Evidencia",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailRow(
    icon: ImageVector,
    label: String,
    value: String,
    colors: AppColors
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = colors.accent, modifier = Modifier.size(20.dp))
        Spacer(modifier = Modifier.width(12.dp))
        Text(text = label, fontSize = 13.sp, color = colors.subtext, modifier = Modifier.width(120.dp))
        Text(text = value, fontWeight = FontWeight.SemiBold, color = colors.text)
    }
}
