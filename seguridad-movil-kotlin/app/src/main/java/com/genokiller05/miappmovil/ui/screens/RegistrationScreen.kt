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
import com.genokiller05.miappmovil.data.repository.DataRepository
import com.genokiller05.miappmovil.ui.theme.*
import com.genokiller05.miappmovil.ui.viewmodel.UserViewModel
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegistrationScreen(
    type: String,
    onBack: () -> Unit,
    userViewModel: UserViewModel
) {
    val colors = AppTheme.colors
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val repo = remember { DataRepository() }
    val user by userViewModel.user.collectAsState()

    val (title, subtitle, iconColor) = when (type) {
        "delivery" -> Triple(
            stringResource(R.string.registration_delivery_title),
            stringResource(R.string.registration_delivery_desc),
            Color(0xFF60A5FA)
        )
        "worker" -> Triple(
            stringResource(R.string.registration_worker_title),
            stringResource(R.string.registration_worker_desc),
            Color(0xFFFB923C)
        )
        else -> Triple(
            stringResource(R.string.registration_visit_title),
            stringResource(R.string.registration_visit_desc),
            Gold
        )
    }

    var isEntry by remember { mutableStateOf(true) }
    var fullName by remember { mutableStateOf("") }
    var company by remember { mutableStateOf("") }
    var purpose by remember { mutableStateOf("") }
    var imageUri by remember { mutableStateOf<Uri?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    val galleryLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        imageUri = uri
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title) },
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
            // Subtitle
            Text(text = subtitle, fontSize = 14.sp, color = colors.subtext)

            Spacer(modifier = Modifier.height(20.dp))

            // Entry/Exit Toggle
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = { isEntry = true },
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isEntry) StatusGreen else colors.card,
                        contentColor = if (isEntry) Color.White else colors.text
                    )
                ) {
                    Icon(Icons.Outlined.Login, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(stringResource(R.string.registration_entry), fontWeight = FontWeight.Bold)
                }
                Button(
                    onClick = { isEntry = false },
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (!isEntry) StatusRed else colors.card,
                        contentColor = if (!isEntry) Color.White else colors.text
                    )
                ) {
                    Icon(Icons.Outlined.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(stringResource(R.string.registration_exit), fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Evidence (photo)
            Text(
                text = stringResource(R.string.registration_evidence_required),
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
                            .height(180.dp)
                            .clip(RoundedCornerShape(16.dp)),
                        contentScale = ContentScale.Crop
                    )
                    IconButton(
                        onClick = { imageUri = null },
                        modifier = Modifier.align(Alignment.TopEnd)
                    ) {
                        Icon(Icons.Outlined.Close, contentDescription = "Remove", tint = Color.White)
                    }
                }
            } else {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp)
                        .clickable { galleryLauncher.launch("image/*") },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.card)
                ) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Outlined.CameraAlt, contentDescription = null, tint = iconColor, modifier = Modifier.size(36.dp))
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(stringResource(R.string.registration_tap_camera), fontSize = 12.sp, color = colors.subtext)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Name
            OutlinedTextField(
                value = fullName,
                onValueChange = { fullName = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text(stringResource(R.string.registration_full_name)) },
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = colors.accent,
                    unfocusedBorderColor = colors.border,
                    focusedContainerColor = colors.inputBackground,
                    unfocusedContainerColor = colors.inputBackground,
                    focusedTextColor = colors.text,
                    unfocusedTextColor = colors.text,
                    focusedLabelColor = colors.accent,
                    unfocusedLabelColor = colors.subtext
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Company
            OutlinedTextField(
                value = company,
                onValueChange = { company = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text(stringResource(R.string.registration_company)) },
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = colors.accent,
                    unfocusedBorderColor = colors.border,
                    focusedContainerColor = colors.inputBackground,
                    unfocusedContainerColor = colors.inputBackground,
                    focusedTextColor = colors.text,
                    unfocusedTextColor = colors.text,
                    focusedLabelColor = colors.accent,
                    unfocusedLabelColor = colors.subtext
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Purpose
            OutlinedTextField(
                value = purpose,
                onValueChange = { purpose = it },
                modifier = Modifier.fillMaxWidth(),
                label = {
                    Text(
                        if (type == "visit") stringResource(R.string.registration_visit_purpose)
                        else stringResource(R.string.registration_other_purpose)
                    )
                },
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = colors.accent,
                    unfocusedBorderColor = colors.border,
                    focusedContainerColor = colors.inputBackground,
                    unfocusedContainerColor = colors.inputBackground,
                    focusedTextColor = colors.text,
                    unfocusedTextColor = colors.text,
                    focusedLabelColor = colors.accent,
                    unfocusedLabelColor = colors.subtext
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(30.dp))

            // Submit
            Button(
                onClick = {
                    if (fullName.isBlank() || imageUri == null) {
                        Toast.makeText(context, context.getString(R.string.registration_missing_data_msg), Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    isLoading = true
                    scope.launch {
                        try {
                            val guardId = user?.id ?: user?.document_id ?: ""
                            val now = LocalDateTime.now()
                            val tipoStr = if (isEntry) "Entrada" else "Salida"
                            val desc = "$tipoStr - $type: $fullName" +
                                    (if (company.isNotBlank()) " | $company" else "") +
                                    (if (purpose.isNotBlank()) " | $purpose" else "")

                            // Upload photo
                            val inputStream = context.contentResolver.openInputStream(imageUri!!)
                            val bytes = inputStream?.readBytes() ?: ByteArray(0)
                            inputStream?.close()
                            if (bytes.isNotEmpty()) {
                                repo.uploadEntryEvidence(bytes, guardId)
                            }

                            val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
                            val entryData = com.genokiller05.miappmovil.data.model.EntryExit(
                                id = java.util.UUID.randomUUID().toString(),
                                fechaHora = now.format(formatter),
                                tipo = tipoStr,
                                descripcion = desc,
                                idRelacionado = guardId,
                                site_id = user?.site_id
                            )
                            repo.createEntryExit(entryData)

                            val msg = if (isEntry) context.getString(R.string.registration_entry_success)
                                      else context.getString(R.string.registration_exit_success)
                            Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                            isLoading = false
                            onBack()
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
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isEntry) StatusGreen else StatusRed
                )
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                } else {
                    Text(
                        text = if (isEntry) stringResource(R.string.registration_register_entry)
                               else stringResource(R.string.registration_register_exit),
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 16.sp
                    )
                }
            }
        }
    }
}
