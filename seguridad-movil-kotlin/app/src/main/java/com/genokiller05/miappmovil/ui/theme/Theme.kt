package com.genokiller05.miappmovil.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Color

data class AppColors(
    val background: Color,
    val card: Color,
    val text: Color,
    val subtext: Color,
    val accent: Color,
    val danger: Color,
    val border: Color,
    val inputBackground: Color,
    val isDarkMode: Boolean
)

val LocalAppColors = compositionLocalOf {
    AppColors(
        background = LightBackground,
        card = LightCard,
        text = LightText,
        subtext = LightSubtext,
        accent = LightAccent,
        danger = LightDanger,
        border = LightBorder,
        inputBackground = LightInputBg,
        isDarkMode = false
    )
}

private val DarkColorScheme = darkColorScheme(
    primary = DarkAccent,
    secondary = DeepBlue,
    background = DarkBackground,
    surface = DarkCard,
    onPrimary = DarkText,
    onBackground = DarkText,
    onSurface = DarkText,
    error = DarkDanger,
    outline = DarkBorder
)

private val LightColorScheme = lightColorScheme(
    primary = LightAccent,
    secondary = DeepBlue,
    background = LightBackground,
    surface = LightCard,
    onPrimary = Color.White,
    onBackground = LightText,
    onSurface = LightText,
    error = LightDanger,
    outline = LightBorder
)

@Composable
fun TiresisTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val appColors = if (darkTheme) {
        AppColors(
            background = DarkBackground,
            card = DarkCard,
            text = DarkText,
            subtext = DarkSubtext,
            accent = DarkAccent,
            danger = DarkDanger,
            border = DarkBorder,
            inputBackground = DarkInputBg,
            isDarkMode = true
        )
    } else {
        AppColors(
            background = LightBackground,
            card = LightCard,
            text = LightText,
            subtext = LightSubtext,
            accent = LightAccent,
            danger = LightDanger,
            border = LightBorder,
            inputBackground = LightInputBg,
            isDarkMode = false
        )
    }

    CompositionLocalProvider(LocalAppColors provides appColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content
        )
    }
}

object AppTheme {
    val colors: AppColors
        @Composable
        get() = LocalAppColors.current
}
