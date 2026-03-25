package com.genokiller05.miappmovil.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.automirrored.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.genokiller05.miappmovil.R
import com.genokiller05.miappmovil.data.model.EntryExit
import com.genokiller05.miappmovil.data.repository.DataRepository
import com.genokiller05.miappmovil.ui.theme.*
import com.genokiller05.miappmovil.ui.viewmodel.UserViewModel
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.TemporalAdjusters

data class DayGroup(
    val label: String,
    val dateKey: String,
    val entries: List<EntryExit>,
    val totalHoras: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WeeklyRecordScreen(
    onBack: () -> Unit,
    userViewModel: UserViewModel
) {
    val colors = AppTheme.colors
    val user by userViewModel.user.collectAsState()
    val repo = remember { DataRepository() }

    var weekOffset by remember { mutableIntStateOf(0) }
    var groups by remember { mutableStateOf<List<DayGroup>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    val today = LocalDate.now()
    val monday = today.plusWeeks(weekOffset.toLong())
        .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
    val sunday = monday.plusDays(6)

    val weekLabel = "${monday.format(DateTimeFormatter.ofPattern("dd/MM"))} – ${sunday.format(DateTimeFormatter.ofPattern("dd/MM"))}"

    fun calcHours(entries: List<EntryExit>): String {
        val entradas = entries.filter { it.tipo.equals("entrada", true) }
        val salidas = entries.filter { it.tipo.equals("salida", true) }
        if (entradas.isEmpty() || salidas.isEmpty()) return "—"
        return "${entradas.size}h"
    }

    LaunchedEffect(weekOffset) {
        isLoading = true
        error = null
        try {
            val fromDate = monday.toString()
            val toDate = sunday.toString()
            val data = repo.fetchEntriesExits(fromDate, toDate)

            val dayNames = listOf("Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom")
            val dayGroups = (0..6).map { i ->
                val day = monday.plusDays(i.toLong())
                val dateKey = day.toString()
                val dayEntries = data.filter { it.fechaHora.startsWith(dateKey) }
                DayGroup(
                    label = "${dayNames[i]} ${day.format(DateTimeFormatter.ofPattern("dd/MM"))}",
                    dateKey = dateKey,
                    entries = dayEntries,
                    totalHoras = calcHours(dayEntries)
                )
            }
            groups = dayGroups
        } catch (e: Exception) {
            error = "Error al cargar el registro."
        } finally {
            isLoading = false
        }
    }

    val totalEntradas = groups.sumOf { g -> g.entries.count { it.tipo.equals("entrada", true) } }
    val diasConMov = groups.count { it.entries.isNotEmpty() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.weekly_record_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        isLoading = true
                        weekOffset = weekOffset  // trigger recomposition
                    }) {
                        Icon(Icons.Outlined.Refresh, contentDescription = "Refresh")
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
        Column(modifier = Modifier.padding(padding)) {
            // Week nav
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(colors.card)
                    .padding(14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = { weekOffset-- },
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(if (colors.isDarkMode) Color(0xFF1E293B) else Color(0xFFF1F5F9))
                ) {
                    Icon(Icons.Outlined.ChevronLeft, contentDescription = "Prev", modifier = Modifier.size(18.dp), tint = colors.text)
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(weekLabel, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, color = colors.text)
                    if (weekOffset != 0) {
                        TextButton(onClick = { weekOffset = 0 }) {
                            Text(stringResource(R.string.weekly_record_current_week), fontSize = 11.sp, color = StatusBlue)
                        }
                    }
                }

                IconButton(
                    onClick = { if (weekOffset < 0) weekOffset++ },
                    enabled = weekOffset < 0,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(if (colors.isDarkMode) Color(0xFF1E293B) else Color(0xFFF1F5F9))
                ) {
                    Icon(
                        Icons.Outlined.ChevronRight, contentDescription = "Next",
                        modifier = Modifier.size(18.dp),
                        tint = if (weekOffset < 0) colors.text else colors.text.copy(alpha = 0.3f)
                    )
                }
            }

            when {
                isLoading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(color = StatusBlue)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(stringResource(R.string.weekly_record_loading), color = colors.subtext)
                        }
                    }
                }
                error != null -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Outlined.ErrorOutline, contentDescription = null, tint = colors.subtext, modifier = Modifier.size(48.dp))
                            Text(error!!, color = colors.subtext, modifier = Modifier.padding(top = 12.dp))
                            Button(
                                onClick = { weekOffset = weekOffset },
                                modifier = Modifier.padding(top = 16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = StatusBlue)
                            ) {
                                Text(stringResource(R.string.general_retry), color = Color.White)
                            }
                        }
                    }
                }
                else -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                    ) {
                        // Summary card
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = colors.card)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(18.dp),
                                horizontalArrangement = Arrangement.SpaceAround
                            ) {
                                StatBox(label = stringResource(R.string.weekly_record_records), value = "$totalEntradas", color = StatusBlue)
                                StatBox(label = stringResource(R.string.weekly_record_active_days), value = "$diasConMov", color = StatusGreen)
                                StatBox(label = stringResource(R.string.weekly_record_inactive_days), value = "${7 - diasConMov}", color = StatusAmber)
                            }
                        }

                        // Day cards
                        groups.forEach { day ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 7.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = colors.card)
                            ) {
                                Column {
                                    // Day header
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(16.dp, 12.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(day.label, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = colors.text)
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(20.dp))
                                                .background(
                                                    if (day.entries.isNotEmpty()) StatusGreen.copy(alpha = 0.15f)
                                                    else Color(0xFF64748B).copy(alpha = 0.1f)
                                                )
                                                .padding(horizontal = 10.dp, vertical = 4.dp)
                                        ) {
                                            Text(
                                                text = if (day.entries.isNotEmpty()) day.totalHoras
                                                       else stringResource(R.string.weekly_record_no_record),
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 12.sp,
                                                color = if (day.entries.isNotEmpty()) StatusGreen else colors.subtext
                                            )
                                        }
                                    }

                                    if (day.entries.isEmpty()) {
                                        Text(
                                            text = stringResource(R.string.weekly_record_no_movements),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(16.dp),
                                            color = colors.subtext,
                                            fontSize = 13.sp
                                        )
                                    } else {
                                        day.entries.forEach { entry ->
                                            HorizontalDivider(color = colors.border)
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(16.dp, 11.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(10.dp)
                                                        .clip(CircleShape)
                                                        .background(
                                                            if (entry.tipo.equals("entrada", true)) StatusGreen
                                                            else StatusRed
                                                        )
                                                )
                                                Text(
                                                    text = if (entry.tipo.equals("entrada", true))
                                                        stringResource(R.string.weekly_record_entry)
                                                    else stringResource(R.string.weekly_record_exit),
                                                    fontWeight = FontWeight.SemiBold,
                                                    fontSize = 13.sp,
                                                    color = colors.text,
                                                    modifier = Modifier
                                                        .width(70.dp)
                                                        .padding(start = 12.dp)
                                                )
                                                Text(
                                                    text = entry.fechaHora.substringAfter("T").take(5),
                                                    fontSize = 13.sp,
                                                    color = colors.subtext,
                                                    modifier = Modifier.weight(1f)
                                                )
                                                if (entry.descripcion.isNotBlank()) {
                                                    Text(
                                                        text = entry.descripcion,
                                                        fontSize = 12.sp,
                                                        color = colors.subtext,
                                                        maxLines = 1
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(30.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun StatBox(label: String, value: String, color: Color) {
    val appColors = AppTheme.colors
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = color)
        Text(text = label, fontSize = 12.sp, color = appColors.subtext, modifier = Modifier.padding(top = 2.dp))
    }
}
