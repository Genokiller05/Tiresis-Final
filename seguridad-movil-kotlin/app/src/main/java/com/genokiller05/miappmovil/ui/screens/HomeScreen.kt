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
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.genokiller05.miappmovil.R
import com.genokiller05.miappmovil.ui.theme.*

@Composable
fun HomeScreen(
    onNavigateToSettings: () -> Unit,
    onNavigateToRegistration: (String) -> Unit,
    onNavigateToNewReport: () -> Unit
) {
    val colors = AppTheme.colors

    Box(modifier = Modifier.fillMaxSize()) {
        // Gradient Background
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.linearGradient(
                        colors = if (colors.isDarkMode)
                            listOf(GradientDarkStart, GradientDarkMid, GradientDarkEnd)
                        else
                            listOf(GradientLightStart, GradientLightMid, GradientLightEnd)
                    )
                )
        )

        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = stringResource(R.string.home_guard_button),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.subtext,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = stringResource(R.string.home_dashboard_title),
                        fontSize = 28.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = colors.text
                    )
                }

                IconButton(
                    onClick = onNavigateToSettings,
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(Color.Black.copy(alpha = 0.2f))
                ) {
                    Icon(
                        Icons.Outlined.Person,
                        contentDescription = null,
                        tint = colors.accent
                    )
                }
            }

            // Content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(24.dp)
            ) {
                Text(
                    text = stringResource(R.string.home_register_activity),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.text,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                // Bento Grid
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Big Card - Visit
                    BentoCard(
                        modifier = Modifier
                            .weight(1f)
                            .height(280.dp),
                        icon = Icons.Outlined.People,
                        iconColor = Gold,
                        title = stringResource(R.string.home_new_visit),
                        tag = stringResource(R.string.home_register_action),
                        borderColor = Gold.copy(alpha = 0.4f),
                        isDarkMode = colors.isDarkMode,
                        onClick = { onNavigateToRegistration("visit") }
                    )

                    // Small Column
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .height(280.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Delivery
                        SmallBentoCard(
                            modifier = Modifier
                                .fillMaxWidth()
                                .weight(1f),
                            icon = Icons.Outlined.Inventory2,
                            iconColor = Color(0xFF60A5FA),
                            title = stringResource(R.string.home_delivery),
                            subtitle = stringResource(R.string.home_delivery_desc),
                            borderColor = StatusBlue.copy(alpha = 0.3f),
                            isDarkMode = colors.isDarkMode,
                            onClick = { onNavigateToRegistration("delivery") }
                        )

                        // Worker
                        SmallBentoCard(
                            modifier = Modifier
                                .fillMaxWidth()
                                .weight(1f),
                            icon = Icons.Outlined.Build,
                            iconColor = Color(0xFFFB923C),
                            title = stringResource(R.string.home_services),
                            subtitle = stringResource(R.string.home_services_desc),
                            borderColor = Color(0xFFF97316).copy(alpha = 0.3f),
                            isDarkMode = colors.isDarkMode,
                            onClick = { onNavigateToRegistration("worker") }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Wide Card - Report Incident
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(80.dp)
                        .clickable { onNavigateToNewReport() },
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (colors.isDarkMode)
                            Color(0xFF450A0A).copy(alpha = 0.4f)
                        else
                            Color(0xFFFEE2E2).copy(alpha = 0.6f)
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFFF43F5E).copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Outlined.Warning,
                                contentDescription = null,
                                tint = Color(0xFFF43F5E),
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .padding(start = 14.dp)
                        ) {
                            Text(
                                text = stringResource(R.string.home_report_incident),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = colors.text
                            )
                            Text(
                                text = stringResource(R.string.home_report_desc),
                                fontSize = 12.sp,
                                color = colors.subtext
                            )
                        }
                        Icon(
                            Icons.Outlined.ChevronRight,
                            contentDescription = null,
                            tint = colors.subtext,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun BentoCard(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    iconColor: Color,
    title: String,
    tag: String,
    borderColor: Color,
    isDarkMode: Boolean,
    onClick: () -> Unit
) {
    val colors = AppTheme.colors
    Card(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isDarkMode) Color(0xFF0F172A).copy(alpha = 0.5f) else Color.White.copy(alpha = 0.65f)
        ),
        border = CardDefaults.outlinedCardBorder().copy(width = 0.5.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .clip(CircleShape)
                    .background(iconColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(32.dp))
            }
            Column {
                Text(
                    text = title,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.text
                )
                Text(
                    text = tag,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.accent,
                    letterSpacing = 1.sp
                )
            }
        }
    }
}

@Composable
fun SmallBentoCard(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    iconColor: Color,
    title: String,
    subtitle: String,
    borderColor: Color,
    isDarkMode: Boolean,
    onClick: () -> Unit
) {
    val colors = AppTheme.colors
    Card(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isDarkMode) Color(0xFF1E293B).copy(alpha = 0.5f) else Color.White.copy(alpha = 0.65f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(iconColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(24.dp))
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = title, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = colors.text)
            Text(text = subtitle, fontSize = 12.sp, color = colors.subtext)
        }
    }
}
