package com.genokiller05.miappmovil.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.genokiller05.miappmovil.R
import com.genokiller05.miappmovil.data.model.IncidentType
import com.genokiller05.miappmovil.data.model.Priority
import com.genokiller05.miappmovil.data.model.ReportInsert
import com.genokiller05.miappmovil.data.model.ReportStatus
import com.genokiller05.miappmovil.data.repository.DataRepository
import com.genokiller05.miappmovil.ui.theme.*
import com.genokiller05.miappmovil.ui.viewmodel.UserViewModel
import kotlinx.coroutines.launch
import android.Manifest
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.genokiller05.miappmovil.ui.components.CameraView
import android.util.Log

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun NewReportScreen(
    onBack: () -> Unit,
    onReportSent: () -> Unit,
    userViewModel: UserViewModel
) {
    val colors = AppTheme.colors
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val repo = remember { DataRepository() }
    val user by userViewModel.user.collectAsState()

    var incidentTypes by remember { mutableStateOf<List<IncidentType>>(emptyList()) }
    var reportStatuses by remember { mutableStateOf<List<ReportStatus>>(emptyList()) }
    var priorities by remember { mutableStateOf<List<Priority>>(emptyList()) }
    var selectedTypeId by remember { mutableStateOf<Int?>(null) }
    var description by remember { mutableStateOf("") }
    var imageUri by remember { mutableStateOf<Uri?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var isCatalogLoading by remember { mutableStateOf(true) }
    var showTypeDropdown by remember { mutableStateOf(false) }
    var showCamera by remember { mutableStateOf(false) }
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)
    val selectedIncidentType = incidentTypes.firstOrNull { it.id == selectedTypeId }

    val cameraLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (!success) imageUri = null
    }

    val galleryLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        imageUri = uri
    }

    LaunchedEffect(Unit) {
        incidentTypes = repo.fetchReportTypes()
        reportStatuses = repo.fetchReportStatuses()
        priorities = repo.fetchPriorities()
        isCatalogLoading = false
    }

    if (showCamera) {
        if (cameraPermissionState.status.isGranted) {
            CameraView(
                onImageCaptured = { uri -> 
                    imageUri = uri
                    showCamera = false
                },
                onError = { Log.e("Camera", "Error capturing: ${it.message}") },
                onClose = { showCamera = false }
            )
        } else {
            LaunchedEffect(Unit) {
                cameraPermissionState.launchPermissionRequest()
            }
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Button(onClick = { cameraPermissionState.launchPermissionRequest() }) {
                    Text("Grant Camera Permission")
                }
            }
        }
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.new_report_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
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
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
        ) {
            // Incident Type dropdown
            Text(
                text = stringResource(R.string.new_report_incident_type),
                fontWeight = FontWeight.SemiBold,
                color = colors.text,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            ExposedDropdownMenuBox(
                expanded = showTypeDropdown,
                onExpandedChange = { showTypeDropdown = it }
            ) {
                OutlinedTextField(
                    value = selectedIncidentType?.name
                        ?: stringResource(R.string.new_report_select_incident_type),
                    onValueChange = {},
                    readOnly = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showTypeDropdown) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = colors.accent,
                        unfocusedBorderColor = colors.border,
                        focusedContainerColor = colors.inputBackground,
                        unfocusedContainerColor = colors.inputBackground,
                        focusedTextColor = colors.text,
                        unfocusedTextColor = colors.text
                    ),
                    shape = RoundedCornerShape(12.dp)
                )
                ExposedDropdownMenu(
                    expanded = showTypeDropdown,
                    onDismissRequest = { showTypeDropdown = false },
                    containerColor = colors.card
                ) {
                    incidentTypes.forEach { type ->
                        DropdownMenuItem(
                            text = { Text(type.name, color = colors.text) },
                            onClick = {
                                selectedTypeId = type.id
                                showTypeDropdown = false
                            }
                        )
                    }
                }
            }

            if (isCatalogLoading) {
                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth(),
                    color = colors.accent,
                    trackColor = colors.border
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Description
            Text(
                text = stringResource(R.string.new_report_detailed_description),
                fontWeight = FontWeight.SemiBold,
                color = colors.text,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                placeholder = {
                    Text(stringResource(R.string.new_report_add_details), color = colors.subtext)
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = colors.accent,
                    unfocusedBorderColor = colors.border,
                    focusedContainerColor = colors.inputBackground,
                    unfocusedContainerColor = colors.inputBackground,
                    focusedTextColor = colors.text,
                    unfocusedTextColor = colors.text
                ),
                shape = RoundedCornerShape(12.dp),
                maxLines = 6
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Evidence
            Text(
                text = stringResource(R.string.new_report_evidence),
                fontWeight = FontWeight.SemiBold,
                color = colors.text,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            if (imageUri != null) {
                Box(modifier = Modifier.fillMaxWidth()) {
                    AsyncImage(
                        model = imageUri,
                        contentDescription = "Evidence",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                            .clip(RoundedCornerShape(16.dp)),
                        contentScale = ContentScale.Crop
                    )
                    IconButton(
                        onClick = { imageUri = null },
                        modifier = Modifier.align(Alignment.TopEnd)
                    ) {
                        Icon(
                            Icons.Outlined.Close,
                            contentDescription = "Remove",
                            tint = Color.White
                        )
                    }
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Galería
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .height(100.dp)
                            .clickable { galleryLauncher.launch("image/*") },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = colors.card),
                        border = CardDefaults.outlinedCardBorder()
                    ) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    Icons.Outlined.PhotoLibrary,
                                    contentDescription = null,
                                    tint = colors.subtext,
                                    modifier = Modifier.size(36.dp)
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "Galería",
                                    fontSize = 12.sp,
                                    color = colors.subtext
                                )
                            }
                        }
                    }

                    // Cámara
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .height(100.dp)
                            .clickable {
                                if (cameraPermissionState.status.isGranted) {
                                    showCamera = true
                                } else {
                                    cameraPermissionState.launchPermissionRequest()
                                }
                            },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = colors.card),
                        border = CardDefaults.outlinedCardBorder()
                    ) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    Icons.Outlined.CameraAlt,
                                    contentDescription = null,
                                    tint = colors.subtext,
                                    modifier = Modifier.size(36.dp)
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "Cámara",
                                    fontSize = 12.sp,
                                    color = colors.subtext
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(30.dp))

            // Submit button
            Button(
                onClick = {
                    if (selectedTypeId == null || description.isBlank()) {
                        Toast.makeText(context, "Por favor completa todos los campos requeridos.", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    isLoading = true
                    scope.launch {
                        try {
                            // IMPORTANT: created_by_guard_id is UUID type in DB.
                            // user.id is the UUID, document_id/idEmpleado are NOT UUIDs.
                            val guardId = user?.id
                            if (guardId.isNullOrEmpty()) {
                                Toast.makeText(context, "Error: No se pudo identificar al guardia. Cierre sesión e intente de nuevo.", Toast.LENGTH_LONG).show()
                                isLoading = false
                                return@launch
                            }

                            val nombreGuardia = user?.nombre?.ifEmpty { user?.full_name } ?: "Guardia"
                            val idEmpleadoStr = user?.idEmpleado?.ifEmpty { user?.document_id } ?: "---"
                            val areaGuardia = user?.area ?: "No asignada"
                            
                            // Resolve site_id: use guard's site_id, or fallback to first available site
                            var siteId = user?.site_id
                            if (siteId.isNullOrEmpty()) {
                                try {
                                    val sites = repo.fetchSites()
                                    siteId = sites.firstOrNull()?.id
                                } catch (_: Exception) { }
                            }
                            if (siteId.isNullOrEmpty()) {
                                Toast.makeText(context, "Error: No hay sitio asignado. Contacte al administrador.", Toast.LENGTH_LONG).show()
                                isLoading = false
                                return@launch
                            }

                            var finalDescription = "Area: $areaGuardia | Guardia: $nombreGuardia (ID: $idEmpleadoStr) | $description"
                            var uploadedEvidenceId: String? = null

                            // Upload evidence if present first
                            if (imageUri != null) {
                                try {
                                    val inputStream = context.contentResolver.openInputStream(imageUri!!)
                                    val bitmap = android.graphics.BitmapFactory.decodeStream(inputStream)
                                    inputStream?.close()

                                    if (bitmap != null) {
                                        // Scale down if too large
                                        val maxDim = 1024f
                                        val scale = kotlin.math.min(maxDim / bitmap.width, maxDim / bitmap.height)
                                        val scaledBitmap = if (scale < 1) {
                                            android.graphics.Bitmap.createScaledBitmap(
                                                bitmap,
                                                (bitmap.width * scale).toInt(),
                                                (bitmap.height * scale).toInt(),
                                                true
                                            )
                                        } else bitmap

                                        val outputStream = java.io.ByteArrayOutputStream()
                                        scaledBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 70, outputStream)
                                        val bytes = outputStream.toByteArray()
                                        
                                        if (scaledBitmap != bitmap) {
                                            scaledBitmap.recycle()
                                        }

                                        if (bytes.isNotEmpty()) {
                                            val (evidenceId, publicUrl) = repo.uploadEntryEvidence(bytes, guardId)
                                            if (publicUrl != null) {
                                                finalDescription = "$finalDescription | Evidencia: $publicUrl"
                                            }
                                            uploadedEvidenceId = evidenceId
                                        }
                                    }
                                } catch (e: Exception) {
                                    android.util.Log.e("NewReportScreen", "Error compressing image", e)
                                }
                            }

                            val pendingStatusId = reportStatuses.firstOrNull { it.code == "pending" }?.id
                                ?: reportStatuses.firstOrNull()?.id
                                ?: 1
                            val mediumPriorityId = priorities.firstOrNull { it.code == "medium" }?.id
                                ?: priorities.firstOrNull()?.id
                                ?: 2

                            val reportData = ReportInsert(
                                report_type_id = selectedTypeId,
                                status_id = pendingStatusId,
                                priority_id = mediumPriorityId,
                                short_description = finalDescription,
                                created_by_guard_id = guardId,
                                site_id = siteId
                            )

                            val report = repo.createReport(reportData)
                            
                            if (uploadedEvidenceId != null) {
                                repo.linkEvidenceToReport(report.id, uploadedEvidenceId)
                            }

                            Toast.makeText(context, context.getString(R.string.new_report_success_message), Toast.LENGTH_LONG).show()
                            isLoading = false
                            onReportSent()
                        } catch (e: Exception) {
                            Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                            isLoading = false
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                enabled = !isLoading && !isCatalogLoading,
                colors = ButtonDefaults.buttonColors(containerColor = colors.accent)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                } else {
                    Text(
                        text = stringResource(R.string.new_report_send_button),
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 16.sp
                    )
                }
            }
        }
    }
}
