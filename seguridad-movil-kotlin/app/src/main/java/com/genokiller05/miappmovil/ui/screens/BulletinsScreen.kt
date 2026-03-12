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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.genokiller05.miappmovil.R
import com.genokiller05.miappmovil.data.model.WeeklyReport
import com.genokiller05.miappmovil.data.repository.DataRepository
import com.genokiller05.miappmovil.ui.theme.*

@Composable
fun BulletinsScreen() {
    val colors = AppTheme.colors
    var reports by remember { mutableStateOf<List<WeeklyReport>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var expandedId by remember { mutableStateOf<String?>(null) }
    var isRefreshing by remember { mutableStateOf(false) }
    val repo = remember { DataRepository() }

    LaunchedEffect(Unit) {
        reports = repo.fetchWeeklyReports()
        isLoading = false
    }

    fun formatDate(iso: String): String {
        if (iso.length < 10) return iso
        val months = listOf("Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic")
        val parts = iso.take(10).split("-")
        val year = parts.getOrNull(0) ?: ""
        val month = parts.getOrNull(1)?.toIntOrNull()?.let { months.getOrNull(it - 1) } ?: ""
        val day = parts.getOrNull(2) ?: ""
        return "$day $month $year"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
    ) {
        // Header
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Text(
                text = stringResource(R.string.bulletins_title),
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = colors.text
            )
            Text(
                text = stringResource(R.string.bulletins_subtitle),
                fontSize = 14.sp,
                color = colors.subtext,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = colors.accent)
            }
        } else if (reports.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Outlined.Description, contentDescription = null, tint = colors.border, modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(stringResource(R.string.bulletins_empty), color = colors.subtext, fontSize = 16.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(reports) { report ->
                    val isExpanded = expandedId == report.id
                    val summary = report.summary_json

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = colors.card),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column {
                            // Header - always visible
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { expandedId = if (isExpanded) null else report.id }
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                    Box(
                                        modifier = Modifier
                                            .size(48.dp)
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(colors.accent.copy(alpha = 0.2f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Outlined.Description, contentDescription = null, tint = colors.accent, modifier = Modifier.size(24.dp))
                                    }
                                    Column(modifier = Modifier.padding(start = 14.dp)) {
                                        Text(
                                            text = stringResource(R.string.bulletins_week_of, formatDate(report.start_date)),
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp,
                                            color = colors.text
                                        )
                                        Text(
                                            text = stringResource(R.string.bulletins_published, formatDate(report.created_at)),
                                            fontSize = 13.sp,
                                            color = colors.subtext
                                        )
                                    }
                                }
                                Icon(
                                    if (isExpanded) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                                    contentDescription = null,
                                    tint = colors.subtext
                                )
                            }

                            // Expanded content
                            if (isExpanded) {
                                HorizontalDivider(color = colors.border)
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = stringResource(R.string.bulletins_activity_summary),
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 14.sp,
                                        color = colors.text,
                                        modifier = Modifier.padding(bottom = 12.dp)
                                    )

                                    // Metrics grid
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        MetricBox(
                                            modifier = Modifier.weight(1f),
                                            icon = Icons.Outlined.Shield,
                                            iconColor = colors.accent,
                                            value = "${summary?.total_reports ?: 0}",
                                            label = stringResource(R.string.bulletins_reports),
                                            colors = colors
                                        )
                                        MetricBox(
                                            modifier = Modifier.weight(1f),
                                            icon = Icons.Outlined.CheckCircleOutline,
                                            iconColor = StatusGreen,
                                            value = "${summary?.status_counts?.completed ?: 0}",
                                            label = stringResource(R.string.bulletins_completed),
                                            colors = colors
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        MetricBox(
                                            modifier = Modifier.weight(1f),
                                            icon = Icons.Outlined.Schedule,
                                            iconColor = StatusAmber,
                                            value = "${summary?.status_counts?.in_process ?: 0}",
                                            label = stringResource(R.string.bulletins_in_process),
                                            colors = colors
                                        )
                                        MetricBox(
                                            modifier = Modifier.weight(1f),
                                            icon = Icons.Outlined.ErrorOutline,
                                            iconColor = StatusRed,
                                            value = "${summary?.status_counts?.pending ?: 0}",
                                            label = stringResource(R.string.bulletins_pending),
                                            colors = colors
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(16.dp))

                                    // Highlights
                                    Row(modifier = Modifier.padding(bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Outlined.LocationOn, contentDescription = null, tint = colors.subtext, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        val criticalArea = summary?.hottest_area ?: stringResource(R.string.bulletins_no_data)
                                        Text(
                                            text = buildAnnotatedString {
                                                withStyle(SpanStyle(fontWeight = FontWeight.Bold)) {
                                                    append(stringResource(R.string.bulletins_critical_area))
                                                }
                                                append(" $criticalArea")
                                            },
                                            fontSize = 14.sp,
                                            color = colors.text
                                        )
                                    }
                                    Row(modifier = Modifier.padding(bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Outlined.Schedule, contentDescription = null, tint = colors.subtext, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        val riskShift = summary?.busiest_slot ?: stringResource(R.string.bulletins_no_data)
                                        Text(
                                            text = buildAnnotatedString {
                                                withStyle(SpanStyle(fontWeight = FontWeight.Bold)) {
                                                    append(stringResource(R.string.bulletins_risk_shift))
                                                }
                                                append(" $riskShift")
                                            },
                                            fontSize = 14.sp,
                                            color = colors.text
                                        )
                                    }

                                    // Admin notes
                                    if (!report.admin_notes.isNullOrBlank()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Card(
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(12.dp),
                                            colors = CardDefaults.cardColors(
                                                containerColor = colors.accent.copy(alpha = 0.08f)
                                            )
                                        ) {
                                            Column(modifier = Modifier.padding(14.dp)) {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Icon(Icons.Outlined.Campaign, contentDescription = null, tint = colors.accent, modifier = Modifier.size(16.dp))
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Text(
                                                        text = stringResource(R.string.bulletins_admin_instructions),
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 13.sp,
                                                        color = colors.accent
                                                    )
                                                }
                                                Spacer(modifier = Modifier.height(8.dp))
                                                Text(
                                                    text = report.admin_notes,
                                                    fontSize = 14.sp,
                                                    lineHeight = 20.sp,
                                                    color = colors.text
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MetricBox(
    modifier: Modifier = Modifier,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: Color,
    value: String,
    label: String,
    colors: AppColors
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (colors.isDarkMode) Color(0xFF1F2937) else Color(0xFFF9FAFB)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = value, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = colors.text)
            Text(text = label, fontSize = 11.sp, color = colors.subtext, letterSpacing = 0.5.sp)
        }
    }
}
