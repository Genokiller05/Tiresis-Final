package com.genokiller05.miappmovil

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.*
import androidx.lifecycle.lifecycleScope
import com.genokiller05.miappmovil.ui.navigation.AppNavigation
import com.genokiller05.miappmovil.ui.theme.TiresisTheme
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

val Context.dataStore by preferencesDataStore(name = "settings")
private val DARK_MODE_KEY = booleanPreferencesKey("dark_mode")

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @OptIn(ExperimentalPermissionsApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            var isDarkMode by remember { mutableStateOf(false) }

            // Request POST_NOTIFICATIONS permission on Android 13+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val notifPermission = rememberPermissionState(Manifest.permission.POST_NOTIFICATIONS)
                LaunchedEffect(Unit) {
                    if (!notifPermission.status.isGranted) {
                        notifPermission.launchPermissionRequest()
                    }
                }
            }

            // Load theme preference
            LaunchedEffect(Unit) {
                isDarkMode = dataStore.data.map { prefs ->
                    prefs[DARK_MODE_KEY] ?: false
                }.first()
            }

            TiresisTheme(darkTheme = isDarkMode) {
                AppNavigation(
                    isDarkMode = isDarkMode,
                    onToggleTheme = {
                        isDarkMode = !isDarkMode
                        lifecycleScope.launch {
                            dataStore.edit { prefs ->
                                prefs[DARK_MODE_KEY] = isDarkMode
                            }
                        }
                    }
                )
            }
        }
    }
}
