package com.genokiller05.miappmovil.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Videocam
import androidx.compose.material.icons.outlined.Assessment
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.genokiller05.miappmovil.data.model.Guard
import com.genokiller05.miappmovil.ui.screens.*
import com.genokiller05.miappmovil.ui.theme.AppTheme
import com.genokiller05.miappmovil.ui.viewmodel.NotificationViewModel
import com.genokiller05.miappmovil.ui.viewmodel.UserViewModel

sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object MainTabs : Screen("main_tabs")
    data object Profile : Screen("profile")
    data object Settings : Screen("settings")
    data object NewReport : Screen("new_report")
    data object Notifications : Screen("notifications")
    data object WeeklyRecord : Screen("weekly_record")
    data object Registration : Screen("registration/{type}") {
        fun createRoute(type: String) = "registration/$type"
    }
    data object ReportDetail : Screen("report_detail/{reportId}") {
        fun createRoute(reportId: String) = "report_detail/$reportId"
    }
}

sealed class TabScreen(val route: String, val title: String, val icon: ImageVector) {
    data object Home : TabScreen("tab_home", "Centro de Monitoreo", Icons.Outlined.Home)
    data object GuardCameras : TabScreen("tab_cameras", "Ver cámara", Icons.Outlined.Videocam)
    data object Reports : TabScreen("tab_reports", "Gestión de Reportes", Icons.Outlined.Assessment)
    data object Bulletins : TabScreen("tab_bulletins", "Boletines", Icons.Outlined.Description)
}

@Composable
fun AppNavigation(
    isDarkMode: Boolean,
    onToggleTheme: () -> Unit,
    userViewModel: UserViewModel = hiltViewModel()
) {
    val navController = rememberNavController()
    val notificationViewModel: NotificationViewModel = hiltViewModel()
    val user by userViewModel.user.collectAsState()

    LaunchedEffect(user?.notificationTargetId()) {
        val userId = user?.notificationTargetId()
        if (!userId.isNullOrBlank()) {
            notificationViewModel.startListening(userId)
        }
    }

    NavHost(navController = navController, startDestination = Screen.Login.route) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.MainTabs.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                userViewModel = userViewModel
            )
        }

        composable(Screen.MainTabs.route) {
            MainTabsScreen(
                onNavigateToSettings = { navController.navigate(Screen.Settings.route) },
                onNavigateToRegistration = { type ->
                    navController.navigate(Screen.Registration.createRoute(type))
                },
                onNavigateToNewReport = { navController.navigate(Screen.NewReport.route) },
                onNavigateToReportDetail = { reportId ->
                    navController.navigate(Screen.ReportDetail.createRoute(reportId))
                },
                userViewModel = userViewModel
            )
        }

        composable(Screen.Profile.route) {
            ProfileScreen(
                onBack = { navController.popBackStack() },
                userViewModel = userViewModel
            )
        }

        composable(Screen.Settings.route) {
            SettingsScreen(
                onBack = { navController.popBackStack() },
                onLogout = {
                    userViewModel.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onNavigateToNotifications = { navController.navigate(Screen.Notifications.route) },
                onNavigateToWeeklyRecord = { navController.navigate(Screen.WeeklyRecord.route) },
                isDarkMode = isDarkMode,
                onToggleTheme = onToggleTheme,
                userViewModel = userViewModel
            )
        }

        composable(Screen.NewReport.route) {
            NewReportScreen(
                onBack = { navController.popBackStack() },
                onReportSent = { navController.popBackStack() },
                userViewModel = userViewModel
            )
        }

        composable(
            route = Screen.Registration.route,
            arguments = listOf(navArgument("type") { type = NavType.StringType })
        ) { backStackEntry ->
            val type = backStackEntry.arguments?.getString("type") ?: "visit"
            RegistrationScreen(
                type = type,
                onBack = { navController.popBackStack() },
                userViewModel = userViewModel
            )
        }

        composable(
            route = Screen.ReportDetail.route,
            arguments = listOf(navArgument("reportId") { type = NavType.StringType })
        ) { backStackEntry ->
            val reportId = backStackEntry.arguments?.getString("reportId") ?: ""
            ReportDetailScreen(
                reportId = reportId,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Notifications.route) {
            NotificationsScreen(
                onBack = { navController.popBackStack() },
                userViewModel = userViewModel
            )
        }

        composable(Screen.WeeklyRecord.route) {
            WeeklyRecordScreen(
                onBack = { navController.popBackStack() },
                userViewModel = userViewModel
            )
        }
    }
}

private fun Guard.notificationTargetId(): String {
    return idEmpleado.ifEmpty { document_id ?: id ?: "" }
}

@Composable
fun MainTabsScreen(
    onNavigateToSettings: () -> Unit,
    onNavigateToRegistration: (String) -> Unit,
    onNavigateToNewReport: () -> Unit,
    onNavigateToReportDetail: (String) -> Unit,
    userViewModel: UserViewModel
) {
    val tabNavController = rememberNavController()
    val tabs = listOf(TabScreen.Home, TabScreen.GuardCameras, TabScreen.Reports, TabScreen.Bulletins)
    val colors = AppTheme.colors

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = colors.card,
                contentColor = colors.text
            ) {
                val navBackStackEntry by tabNavController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination

                tabs.forEach { tab ->
                    NavigationBarItem(
                        icon = { Icon(tab.icon, contentDescription = tab.title) },
                        label = { Text(tab.title, style = MaterialTheme.typography.labelSmall) },
                        selected = currentDestination?.hierarchy?.any { it.route == tab.route } == true,
                        onClick = {
                            tabNavController.navigate(tab.route) {
                                popUpTo(tabNavController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = colors.accent,
                            selectedTextColor = colors.accent,
                            unselectedIconColor = colors.subtext,
                            unselectedTextColor = colors.subtext,
                            indicatorColor = colors.accent.copy(alpha = 0.1f)
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = tabNavController,
            startDestination = TabScreen.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(TabScreen.Home.route) {
                HomeScreen(
                    onNavigateToSettings = onNavigateToSettings,
                    onNavigateToRegistration = onNavigateToRegistration,
                    onNavigateToNewReport = onNavigateToNewReport
                )
            }
            composable(TabScreen.GuardCameras.route) {
                GuardScreen(userViewModel = userViewModel)
            }
            composable(TabScreen.Reports.route) {
                ReportsScreen(
                    onNavigateToNewReport = onNavigateToNewReport,
                    onNavigateToReportDetail = onNavigateToReportDetail
                )
            }
            composable(TabScreen.Bulletins.route) {
                BulletinsScreen()
            }
        }
    }
}
