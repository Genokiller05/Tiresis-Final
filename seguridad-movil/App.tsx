import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Importación de pantallas
import LoginScreen from './LoginScreen';
import GuardScreen from './GuardScreen';
import ReportsScreen from './ReportsScreen';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import NewReportScreen from './NewReportScreen';
import RegistrationScreen from './RegistrationScreen';
import ReportDetailScreen from './ReportDetailScreen';

// --- Tipos para el Stack Navigator principal ---
export type RootStackParamList = {
  LoginScreen: undefined;
  MainTabs: { screen?: keyof TabParamList };
  ProfileScreen: undefined;
  SettingsScreen: undefined;
  NewReportScreen: undefined;
  RegistrationScreen: { type: 'visit' | 'delivery' | 'worker' };
  ReportDetail: { reportId: number };
};

// --- Tipos para el Bottom Tab Navigator (MainTabs) ---
export type TabParamList = {
  Home: undefined;
  GuardCameras: undefined;
  Reports: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

import { useI18n } from './theme/I18nContext';

// --- Componente MainTabs: el Bottom Tab Navigator ---
const MainTabs = () => {
  const { colors, isDarkMode } = useTheme(); // Usamos el hook del tema
  const { t } = useI18n();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent, // Color activo desde el tema
        tabBarInactiveTintColor: colors.subtext, // Color inactivo desde el tema
        tabBarStyle: {
          backgroundColor: colors.card, // Color de fondo de la barra desde el tema
          borderTopColor: colors.border, // Color del borde desde el tema
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{
        title: t('home.guard_button'),
        tabBarIcon: ({ color, size }) => (<Ionicons name="home-outline" size={size} color={color} />),
      }} />
      <Tab.Screen name="GuardCameras" component={GuardScreen} options={{
        title: t('general.view_camera'),
        tabBarIcon: ({ color, size }) => (<Ionicons name="videocam-outline" size={size} color={color} />),
      }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{
        title: t('reports.management_title'),
        tabBarIcon: ({ color, size }) => (<Ionicons name="stats-chart-outline" size={size} color={color} />),
      }} />
    </Tab.Navigator>
  );
};


// --- Componente contenedor que conecta el tema con la navegación ---
const AppNavigator = () => {
  const { colors, isDarkMode } = useTheme();

  // Creamos un tema para React Navigation basado en nuestro tema personalizado.
  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Stack.Navigator
        initialRouteName="LoginScreen"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        <Stack.Screen name="NewReportScreen" component={NewReportScreen} />
        <Stack.Screen name="RegistrationScreen" component={RegistrationScreen} />
        <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};


import { I18nProvider } from './theme/I18nContext';

// --- Componente principal de la aplicación con el Stack Navigator ---
const App = () => {
  return (
    <SafeAreaProvider>
      {/* Envolvemos toda la navegación con el ThemeProvider */}
      <ThemeProvider>
        <I18nProvider>
          <AppNavigator />
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
