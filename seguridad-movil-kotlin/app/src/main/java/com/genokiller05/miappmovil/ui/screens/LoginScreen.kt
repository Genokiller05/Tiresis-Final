package com.genokiller05.miappmovil.ui.screens

import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.genokiller05.miappmovil.R
import com.genokiller05.miappmovil.data.repository.DataRepository
import com.genokiller05.miappmovil.ui.theme.*
import com.genokiller05.miappmovil.ui.viewmodel.UserViewModel
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    userViewModel: UserViewModel
) {
    val colors = AppTheme.colors
    val context = LocalContext.current
    var email by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val dataRepository = remember { DataRepository() }

    // Pulse animation
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    Box(
        modifier = Modifier.fillMaxSize()
    ) {
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

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo area with pulse
            Box(
                modifier = Modifier
                    .size(150.dp)
                    .scale(scale),
                contentAlignment = Alignment.Center
            ) {
                // Gold circle glow
                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .clip(RoundedCornerShape(60.dp))
                        .background(Gold.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "T",
                        fontSize = 48.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Gold
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Title
            Text(
                text = "TIRESIS",
                fontSize = 32.sp,
                fontWeight = FontWeight.ExtraBold,
                color = if (colors.isDarkMode) Color(0xFFF8FAFC) else Color(0xFF1E293B),
                letterSpacing = 1.sp
            )

            Text(
                text = stringResource(R.string.login_subtitle),
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = Gold,
                letterSpacing = 1.5.sp
            )

            Spacer(modifier = Modifier.height(40.dp))

            // Glass Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(30.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (colors.isDarkMode)
                        Color(0xFF0F172A).copy(alpha = 0.75f)
                    else
                        Color.White.copy(alpha = 0.7f)
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 5.dp)
            ) {
                Column(modifier = Modifier.padding(30.dp)) {
                    // Email Label
                    Text(
                        text = stringResource(R.string.login_email_label),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (colors.isDarkMode) Color(0xFFCBD5E1) else Color(0xFF475569),
                        modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
                    )

                    // Email Input
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = {
                            Text(
                                stringResource(R.string.login_email_placeholder),
                                color = Color(0xFF94A3B8)
                            )
                        },
                        leadingIcon = {
                            Icon(
                                Icons.Outlined.Email,
                                contentDescription = null,
                                tint = Color(0xFF94A3B8)
                            )
                        },
                        shape = RoundedCornerShape(16.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = colors.accent,
                            unfocusedBorderColor = if (colors.isDarkMode) Color(0xFF334155) else Color(0xFFCBD5E1),
                            focusedContainerColor = if (colors.isDarkMode) Color(0xFF1E293B).copy(alpha = 0.5f) else Color(0xFFF8FAFC),
                            unfocusedContainerColor = if (colors.isDarkMode) Color(0xFF1E293B).copy(alpha = 0.5f) else Color(0xFFF8FAFC),
                            focusedTextColor = colors.text,
                            unfocusedTextColor = colors.text
                        ),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Login Button
                    Button(
                        onClick = {
                            if (email.isBlank()) {
                                Toast.makeText(context, context.getString(R.string.login_enter_email), Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            isLoading = true
                            scope.launch {
                                try {
                                    val guard = dataRepository.loginByEmail(email)
                                    if (guard == null) {
                                        Toast.makeText(context, context.getString(R.string.login_email_not_found), Toast.LENGTH_LONG).show()
                                        isLoading = false
                                        return@launch
                                    }
                                    userViewModel.login(guard)
                                    isLoading = false
                                    onLoginSuccess()
                                } catch (e: Exception) {
                                    Toast.makeText(context, context.getString(R.string.login_generic_error), Toast.LENGTH_LONG).show()
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
                            containerColor = colors.accent
                        )
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                text = stringResource(R.string.login_button),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(40.dp))

            Text(
                text = stringResource(R.string.login_version),
                fontSize = 12.sp,
                color = if (colors.isDarkMode) Color(0xFF64748B) else Color(0xFF94A3B8),
                textAlign = TextAlign.Center
            )
        }
    }
}
