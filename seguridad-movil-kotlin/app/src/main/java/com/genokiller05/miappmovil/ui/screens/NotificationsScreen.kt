package com.genokiller05.miappmovil.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.genokiller05.miappmovil.R
import com.genokiller05.miappmovil.data.model.GuardNotification
import com.genokiller05.miappmovil.data.repository.NotificationRepository
import com.genokiller05.miappmovil.ui.theme.*
import com.genokiller05.miappmovil.ui.viewmodel.UserViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    onBack: () -> Unit,
    userViewModel: UserViewModel
) {
    val colors = AppTheme.colors
    val user by userViewModel.user.collectAsState()
    val repo = remember { NotificationRepository() }
    val scope = rememberCoroutineScope()

    var notifications by remember { mutableStateOf<List<GuardNotification>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    val guardId = user?.id ?: user?.document_id ?: ""

    LaunchedEffect(guardId) {
        if (guardId.isNotEmpty()) {
            notifications = repo.fetchNotifications(guardId)
        }
        isLoading = false
    }

    val unreadCount = notifications.count { !it.is_read }

    fun getNotifIcon(type: String): Pair<ImageVector, Color> = when (type) {
        "alert" -> Pair(Icons.Outlined.Warning, StatusAmber)
        "report" -> Pair(Icons.Outlined.Assessment, StatusBlue)
        "system" -> Pair(Icons.Outlined.Settings, StatusPurple)
        "entry" -> Pair(Icons.Outlined.Login, StatusGreen)
        "exit" -> Pair(Icons.Outlined.Logout, StatusRed)
        else -> Pair(Icons.Outlined.Notifications, colors.accent)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(R.string.notifications_title))
                        if (unreadCount > 0) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(colors.accent.copy(alpha = 0.2f))
                                    .padding(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "$unreadCount ${stringResource(R.string.notifications_unread)}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colors.accent
                                )
                            }
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Outlined.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (unreadCount > 0) {
                        TextButton(onClick = {
                            scope.launch {
                                repo.markAllAsRead(guardId)
                                notifications = notifications.map { it.copy(is_read = true) }
                            }
                        }) {
                            Text(
                                stringResource(R.string.notifications_mark_all_read),
                                fontSize = 12.sp,
                                color = colors.accent
                            )
                        }
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
        } else if (notifications.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Outlined.NotificationsOff, contentDescription = null, tint = colors.subtext, modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(stringResource(R.string.notifications_no_notifications), color = colors.subtext)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(notifications) { notif ->
                    val (icon, iconColor) = getNotifIcon(notif.type)

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (!notif.is_read) {
                                    scope.launch {
                                        repo.markAsRead(notif.id)
                                        notifications = notifications.map {
                                            if (it.id == notif.id) it.copy(is_read = true) else it
                                        }
                                    }
                                }
                            },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (!notif.is_read)
                                colors.accent.copy(alpha = 0.05f)
                            else colors.card
                        )
                    ) {
                        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(iconColor.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(22.dp))
                            }
                            Column(
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(start = 12.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = notif.title,
                                        fontWeight = if (!notif.is_read) FontWeight.Bold else FontWeight.Medium,
                                        fontSize = 14.sp,
                                        color = colors.text,
                                        modifier = Modifier.weight(1f)
                                    )
                                    if (!notif.is_read) {
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .clip(CircleShape)
                                                .background(colors.accent)
                                        )
                                    }
                                }
                                Text(
                                    text = notif.body,
                                    fontSize = 13.sp,
                                    color = colors.subtext,
                                    maxLines = 2,
                                    modifier = Modifier.padding(top = 4.dp)
                                )
                                Text(
                                    text = notif.created_at.take(10),
                                    fontSize = 11.sp,
                                    color = colors.subtext.copy(alpha = 0.7f),
                                    modifier = Modifier.padding(top = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
