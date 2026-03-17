package com.genokiller05.miappmovil.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.genokiller05.miappmovil.R
import com.genokiller05.miappmovil.ui.theme.*
import com.genokiller05.miappmovil.ui.viewmodel.NotificationViewModel
import com.genokiller05.miappmovil.ui.viewmodel.UserViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    onLogout: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToWeeklyRecord: () -> Unit,
    isDarkMode: Boolean,
    onToggleTheme: () -> Unit,
    userViewModel: UserViewModel
) {
    val colors = AppTheme.colors
    val user by userViewModel.user.collectAsState()
    val notificationViewModel: NotificationViewModel = hiltViewModel()
    val notifications by notificationViewModel.notifications.collectAsState()

    val userId = user?.idEmpleado?.ifEmpty { user?.document_id ?: user?.id } ?: ""
    LaunchedEffect(userId) {
        if (userId.isNotEmpty()) notificationViewModel.startListening(userId)
    }

    val unreadCount = notifications.count { it.status == "pending" }

    val nombre = user?.nombre?.ifEmpty { user?.full_name } ?: "Guardia"
    val initials = nombre.split(" ").take(2).mapNotNull { it.firstOrNull()?.uppercaseChar() }.joinToString("")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.settings_title)) },
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
            // Profile Header Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = colors.card)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(DeepBlue),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = initials,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Gold
                        )
                    }
                    Column(modifier = Modifier.padding(start = 14.dp)) {
                        Text(nombre, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = colors.text)
                        Text(user?.email ?: "", fontSize = 13.sp, color = colors.subtext)
                        if (user?.area != null) {
                            Text(
                                text = "${stringResource(R.string.settings_area)}: ${user?.area}",
                                fontSize = 12.sp,
                                color = colors.subtext
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Dark mode toggle
            SettingsRow(
                icon = Icons.Outlined.DarkMode,
                label = stringResource(R.string.settings_dark_mode),
                colors = colors,
                trailing = {
                    Switch(
                        checked = isDarkMode,
                        onCheckedChange = { onToggleTheme() },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Gold,
                            checkedTrackColor = Gold.copy(alpha = 0.3f)
                        )
                    )
                }
            )

            // Notifications
            SettingsRow(
                icon = Icons.Outlined.Notifications,
                label = stringResource(R.string.settings_notifications),
                colors = colors,
                onClick = onNavigateToNotifications,
                trailing = {
                    if (unreadCount > 0) {
                        Box(
                            modifier = Modifier
                                .size(24.dp)
                                .clip(CircleShape)
                                .background(StatusRed),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "$unreadCount",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = colors.subtext, modifier = Modifier.size(20.dp))
                }
            )

            // Weekly Record
            SettingsRow(
                icon = Icons.Outlined.DateRange,
                label = stringResource(R.string.settings_weekly_record),
                colors = colors,
                onClick = onNavigateToWeeklyRecord,
                trailing = {
                    Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = colors.subtext, modifier = Modifier.size(20.dp))
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Logout
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onLogout() },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = StatusRed.copy(alpha = 0.1f)
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.Logout, contentDescription = null, tint = StatusRed, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.settings_logout),
                        fontWeight = FontWeight.SemiBold,
                        color = StatusRed
                    )
                }
            }
        }
    }
}

@Composable
fun SettingsRow(
    icon: ImageVector,
    label: String,
    colors: AppColors,
    onClick: (() -> Unit)? = null,
    trailing: @Composable RowScope.() -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 10.dp)
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = colors.card)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.accent.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = colors.accent, modifier = Modifier.size(22.dp))
            }
            Text(
                text = label,
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 14.dp),
                fontWeight = FontWeight.Medium,
                color = colors.text
            )
            trailing()
        }
    }
}
