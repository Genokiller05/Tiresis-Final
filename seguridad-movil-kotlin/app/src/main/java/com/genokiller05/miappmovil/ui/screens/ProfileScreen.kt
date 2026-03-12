package com.genokiller05.miappmovil.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.genokiller05.miappmovil.R
import com.genokiller05.miappmovil.ui.theme.*
import com.genokiller05.miappmovil.ui.viewmodel.UserViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onBack: () -> Unit,
    userViewModel: UserViewModel
) {
    val colors = AppTheme.colors
    val user by userViewModel.user.collectAsState()

    val nombre = user?.nombre?.ifEmpty { user?.full_name } ?: "Guardia"
    val email = user?.email ?: "—"
    val idEmpleado = user?.idEmpleado?.ifEmpty { user?.document_id } ?: "—"
    val area = user?.area ?: stringResource(R.string.profile_no_area)
    val telefono = user?.telefono ?: user?.phone ?: stringResource(R.string.profile_no_phone)
    val direccion = user?.direccion ?: stringResource(R.string.profile_no_address)
    val estado = user?.estado ?: "—"
    val photoUrl = user?.foto ?: user?.photo_url

    val initials = nombre.split(" ").take(2).mapNotNull { it.firstOrNull()?.uppercaseChar() }.joinToString("")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.home_profile_button)) },
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
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Avatar
            Box(
                modifier = Modifier.size(100.dp),
                contentAlignment = Alignment.Center
            ) {
                if (photoUrl != null) {
                    AsyncImage(
                        model = photoUrl,
                        contentDescription = nombre,
                        modifier = Modifier
                            .size(100.dp)
                            .clip(CircleShape)
                            .border(3.dp, Gold, CircleShape),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(100.dp)
                            .clip(CircleShape)
                            .background(DeepBlue)
                            .border(3.dp, Gold, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = initials,
                            fontSize = 36.sp,
                            fontWeight = FontWeight.Bold,
                            color = Gold
                        )
                    }
                }

                // Status dot
                val dotColor = when (estado) {
                    "En servicio" -> StatusGreen
                    else -> StatusGray
                }
                Box(
                    modifier = Modifier
                        .size(18.dp)
                        .clip(CircleShape)
                        .background(dotColor)
                        .border(3.dp, colors.background, CircleShape)
                        .align(Alignment.BottomEnd)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(text = nombre, fontWeight = FontWeight.Bold, fontSize = 22.sp, color = colors.text)

            Box(
                modifier = Modifier
                    .padding(top = 8.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(
                        if (estado == "En servicio") StatusGreen.copy(alpha = 0.15f)
                        else StatusGray.copy(alpha = 0.15f)
                    )
                    .padding(horizontal = 12.dp, vertical = 4.dp)
            ) {
                Text(
                    text = estado,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (estado == "En servicio") StatusGreen else StatusGray
                )
            }

            Spacer(modifier = Modifier.height(30.dp))

            // Info Cards
            ProfileInfoCard(icon = Icons.Outlined.Person, label = stringResource(R.string.profile_full_name), value = nombre, colors = colors)
            ProfileInfoCard(icon = Icons.Outlined.Badge, label = stringResource(R.string.profile_guard_id), value = idEmpleado, colors = colors)
            ProfileInfoCard(icon = Icons.Outlined.Email, label = stringResource(R.string.profile_email), value = email, colors = colors)
            ProfileInfoCard(icon = Icons.Outlined.LocationOn, label = stringResource(R.string.profile_assigned_area), value = area, colors = colors)
            ProfileInfoCard(icon = Icons.Outlined.Phone, label = stringResource(R.string.profile_phone), value = telefono, colors = colors)
            ProfileInfoCard(icon = Icons.Outlined.Home, label = stringResource(R.string.profile_address), value = direccion, colors = colors)
        }
    }
}

@Composable
fun ProfileInfoCard(
    icon: ImageVector,
    label: String,
    value: String,
    colors: AppColors
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = colors.card)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.accent.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = colors.accent, modifier = Modifier.size(20.dp))
            }
            Column(modifier = Modifier.padding(start = 14.dp)) {
                Text(text = label, fontSize = 11.sp, color = colors.subtext)
                Text(text = value, fontWeight = FontWeight.SemiBold, color = colors.text)
            }
        }
    }
}
