package com.genokiller05.miappmovil.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.genokiller05.miappmovil.data.model.CameraFeed
import com.genokiller05.miappmovil.ui.components.StreamPlayer
import com.genokiller05.miappmovil.ui.theme.AppTheme
import com.genokiller05.miappmovil.ui.theme.StatusGreen
import com.genokiller05.miappmovil.ui.theme.StatusRed
import com.genokiller05.miappmovil.ui.viewmodel.CameraViewModel
import com.genokiller05.miappmovil.ui.viewmodel.UserViewModel

@Composable
fun GuardScreen(
    userViewModel: UserViewModel,
    cameraViewModel: CameraViewModel = hiltViewModel()
) {
    val colors = AppTheme.colors
    val currentUser by userViewModel.user.collectAsStateWithLifecycle()
    val cameras by cameraViewModel.cameras.collectAsStateWithLifecycle()
    val isLoading by cameraViewModel.isLoading.collectAsStateWithLifecycle()
    val error by cameraViewModel.error.collectAsStateWithLifecycle()
    var selectedCamera by remember { mutableStateOf<CameraFeed?>(null) }

    LaunchedEffect(currentUser?.site_id) {
        cameraViewModel.loadCameras(currentUser?.site_id)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Centro de cámaras",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.text
                )
                Text(
                    text = "Reproducción remota en vivo",
                    fontSize = 13.sp,
                    color = colors.subtext
                )
            }

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
                Spacer(modifier = Modifier.size(6.dp))
                Text(
                    text = "Sistema activo",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = StatusGreen
                )
            }
        }

        when {
            isLoading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = colors.accent)
                }
            }

            cameras.isEmpty() -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = error ?: "No hay cámaras registradas.",
                        color = colors.subtext
                    )
                }
            }

            else -> {
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
                                .clickable { selectedCamera = camera },
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = colors.card),
                            elevation = CardDefaults.cardElevation(defaultElevation = 5.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Color(0xFF0F172A)),
                                contentAlignment = Alignment.Center
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(60.dp)
                                        .clip(CircleShape)
                                        .background(Color.Black.copy(alpha = 0.5f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        if (camera.activa) Icons.Outlined.PlayArrow else Icons.Outlined.CloudOff,
                                        contentDescription = null,
                                        tint = if (camera.activa) Color.White else Color(0xFF64748B),
                                        modifier = Modifier.size(30.dp)
                                    )
                                }

                                Row(
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .padding(12.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(
                                            if (camera.activa) Color.Black.copy(alpha = 0.6f)
                                            else StatusRed.copy(alpha = 0.2f)
                                        )
                                        .padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(if (camera.activa) StatusGreen else StatusRed)
                                    )
                                    Spacer(modifier = Modifier.size(6.dp))
                                    Text(
                                        text = if (camera.activa) "LIVE" else "OFFLINE",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (camera.activa) Color.White else StatusRed
                                    )
                                }

                                Surface(
                                    modifier = Modifier
                                        .align(Alignment.TopStart)
                                        .padding(12.dp),
                                    shape = RoundedCornerShape(999.dp),
                                    color = Color.Black.copy(alpha = 0.55f)
                                ) {
                                    Text(
                                        text = if (camera.stereoEnabled) "Stereo" else camera.primaryStreamType.uppercase(),
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                        color = Color(0xFF7DD3FC),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomStart)
                                        .fillMaxWidth()
                                        .background(Color.Black.copy(alpha = 0.7f))
                                        .padding(12.dp)
                                ) {
                                    Column {
                                        Text(
                                            text = camera.name,
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp
                                        )
                                        Text(
                                            text = camera.area,
                                            color = Color(0xFF94A3B8),
                                            fontSize = 12.sp
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

    if (selectedCamera != null) {
        CameraDialog(
            camera = selectedCamera!!,
            onDismiss = { selectedCamera = null }
        )
    }
}

@Composable
private fun CameraDialog(
    camera: CameraFeed,
    onDismiss: () -> Unit
) {
    val colors = AppTheme.colors

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = colors.card,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = camera.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 22.sp,
                    color = colors.text
                )
                Text(
                    text = "${camera.area} · ${camera.marca} ${camera.modelo}",
                    color = colors.subtext,
                    fontSize = 13.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                if (camera.playbackUrls.primary.isNotBlank()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .aspectRatio(16f / 9f)
                            .clip(RoundedCornerShape(18.dp))
                            .background(Color.Black)
                    ) {
                        StreamPlayer(
                            url = absoluteStreamUrl(camera.playbackUrls.primary),
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                } else {
                    OfflinePanel()
                }

                if (camera.stereoEnabled) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        StereoPanel(
                            title = "Izquierda",
                            streamUrl = camera.playbackUrls.left
                        )
                        StereoPanel(
                            title = "Derecha",
                            streamUrl = camera.playbackUrls.right
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.align(Alignment.End)
                ) {
                    Text("Cerrar")
                }
            }
        }
    }
}

@Composable
private fun StereoPanel(
    title: String,
    streamUrl: String,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = title,
            color = Color(0xFFCBD5E1),
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1.1f)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.Black)
        ) {
            if (streamUrl.isBlank()) {
                OfflinePanel()
            } else {
                StreamPlayer(
                    url = absoluteStreamUrl(streamUrl),
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
    }
}

@Composable
private fun OfflinePanel() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                Icons.Outlined.CloudOff,
                contentDescription = null,
                tint = Color(0xFF64748B),
                modifier = Modifier.size(64.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Sin stream disponible",
                fontWeight = FontWeight.Bold,
                color = Color(0xFF94A3B8)
            )
        }
    }
}

private fun absoluteStreamUrl(value: String): String {
    return if (value.startsWith("http://") || value.startsWith("https://")) {
        value
    } else {
        "http://10.0.2.2:3000$value"
    }
}
