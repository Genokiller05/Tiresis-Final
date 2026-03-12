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
import com.genokiller05.miappmovil.data.model.ReportInsert
import com.genokiller05.miappmovil.data.repository.DataRepository
import com.genokiller05.miappmovil.ui.theme.*
import com.genokiller05.miappmovil.ui.viewmodel.UserViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
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

    var selectedType by remember { mutableIntStateOf(0) }
    var description by remember { mutableStateOf("") }
    var imageUri by remember { mutableStateOf<Uri?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var showTypeDropdown by remember { mutableStateOf(false) }

    val incidentTypes = listOf(
        Pair(1, "Robo / Hurto"),
        Pair(2, "Vandalismo"),
        Pair(3, "Acceso no autorizado"),
        Pair(4, "Emergencia médica"),
        Pair(5, "Incendio"),
        Pair(6, "Inundación"),
        Pair(7, "Falla eléctrica"),
        Pair(8, "Otro")
    )

    val cameraLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (!success) imageUri = null
    }

    val galleryLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        imageUri = uri
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.new_report_title)) },
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
                    value = incidentTypes.find { it.first == selectedType }?.second
                        ?: stringResource(R.string.new_report_select_incident_type),
                    onValueChange = {},
                    readOnly = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(),
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
                    incidentTypes.forEach { (id, name) ->
                        DropdownMenuItem(
                            text = { Text(name, color = colors.text) },
                            onClick = {
                                selectedType = id
                                showTypeDropdown = false
                            }
                        )
                    }
                }
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
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp)
                        .clickable { galleryLauncher.launch("image/*") },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.card),
                    border = CardDefaults.outlinedCardBorder()
                ) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Outlined.CameraAlt,
                                contentDescription = null,
                                tint = colors.subtext,
                                modifier = Modifier.size(36.dp)
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = stringResource(R.string.new_report_evidence_helper_camera),
                                fontSize = 12.sp,
                                color = colors.subtext
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(30.dp))

            // Submit button
            Button(
                onClick = {
                    if (selectedType == 0 || description.isBlank()) {
                        Toast.makeText(context, "Por favor completa todos los campos requeridos.", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    isLoading = true
                    scope.launch {
                        try {
                            val guardId = user?.id ?: user?.document_id ?: ""
                            val reportData = ReportInsert(
                                report_type_id = selectedType,
                                status_id = 1,
                                priority_id = 2,
                                short_description = description,
                                created_by_guard_id = guardId,
                                site_id = user?.site_id
                            )

                            val report = repo.createReport(reportData)

                            // Upload evidence if present
                            if (imageUri != null) {
                                val inputStream = context.contentResolver.openInputStream(imageUri!!)
                                val bytes = inputStream?.readBytes() ?: ByteArray(0)
                                inputStream?.close()
                                if (bytes.isNotEmpty()) {
                                    val (evidenceId, _) = repo.uploadEntryEvidence(bytes, guardId)
                                    if (evidenceId != null) {
                                        repo.linkEvidenceToReport(report.id, evidenceId)
                                    }
                                }
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
                enabled = !isLoading,
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
