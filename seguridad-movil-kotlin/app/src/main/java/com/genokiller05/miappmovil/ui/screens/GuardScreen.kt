package com.genokiller05.miappmovil.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.genokiller05.miappmovil.R
import com.genokiller05.miappmovil.ui.theme.*

data class CameraInfo(val id: Int, val name: String, val online: Boolean)

@Composable
fun GuardScreen() {
    val colors = AppTheme.colors
    var selectedCameraId by remember { mutableIntStateOf(-1) }
    var showDialog by remember { mutableStateOf(false) }

    val cameras = remember {
        listOf(
            CameraInfo(1, "Cámara 1", true),
            CameraInfo(2, "Cámara 2", false),
            CameraInfo(3, "Cámara 3", false),
            CameraInfo(4, "Cámara 4", false),
            CameraInfo(5, "Cámara 5", false),
            CameraInfo(6, "Cámara 6", false),
            CameraInfo(7, "Cámara 7", false),
            CameraInfo(8, "Cámara 8", false),
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stringResource(R.string.home_guard_button),
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = colors.text
            )
            // Live indicator
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(StatusGreen.copy(alpha = 0.2f))
                    .padding(horizontal = 10.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(StatusGreen)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = stringResource(R.string.guard_system_active),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = StatusGreen
                )
            }
        }

        // Camera Grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(1),
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(bottom = 40.dp)
        ) {
            items(cameras) { camera ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(16f / 9f)
                        .clickable {
                            selectedCameraId = camera.id
                            showDialog = true
                        },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.card),
                    elevation = CardDefaults.cardElevation(defaultElevation = 5.dp),
                    border = if (selectedCameraId == camera.id) CardDefaults.outlinedCardBorder().copy(
                        width = 2.dp
                    ) else null
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color(0xFF0F172A)),
                        contentAlignment = Alignment.Center
                    ) {
                        // Play/Offline icon
                        Box(
                            modifier = Modifier
                                .size(60.dp)
                                .clip(CircleShape)
                                .background(Color.Black.copy(alpha = 0.5f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                if (camera.online) Icons.Outlined.PlayArrow else Icons.Outlined.CloudOff,
                                contentDescription = null,
                                tint = if (camera.online) Color.White else Color(0xFF64748B),
                                modifier = Modifier.size(30.dp)
                            )
                        }

                        // Status badge top right
                        Row(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(12.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(
                                    if (camera.online) Color.Black.copy(alpha = 0.6f)
                                    else StatusRed.copy(alpha = 0.2f)
                                )
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(if (camera.online) StatusGreen else StatusRed)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (camera.online) stringResource(R.string.guard_live) else stringResource(R.string.guard_offline),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (camera.online) Color.White else StatusRed
                            )
                        }

                        // Bottom name bar
                        Box(
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .fillMaxWidth()
                                .background(Color.Black.copy(alpha = 0.7f))
                                .padding(12.dp)
                        ) {
                            Text(
                                text = camera.name,
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        }
                    }
                }
            }
        }
    }

    // View modal dialog
    if (showDialog) {
        val selectedCamera = cameras.find { it.id == selectedCameraId }
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = {
                Text("${selectedCamera?.name ?: ""} - ${stringResource(R.string.guard_live_view)}")
            },
            text = {
                Column {
                    if (selectedCamera?.online == true) {
                        Text("Mostrando feed de la cámara en vivo.", color = colors.text)
                    } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Outlined.CloudOff,
                                contentDescription = null,
                                tint = Color(0xFF64748B),
                                modifier = Modifier.size(64.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = stringResource(R.string.guard_signal_lost),
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF94A3B8)
                            )
                            Text(
                                text = stringResource(R.string.guard_not_streaming),
                                color = Color(0xFF64748B),
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showDialog = false }) {
                    Text("Cerrar")
                }
            }
        )
    }
}
