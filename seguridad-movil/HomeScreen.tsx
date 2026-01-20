import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from './theme/ThemeContext';
import { useI18n } from './theme/I18nContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

type RootStackParamList = {
  LoginScreen: undefined;
  MainTabs: { screen?: string };
  ProfileScreen: undefined;
  SettingsScreen: undefined;
  RegistrationScreen: { type: 'visit' | 'delivery' | 'worker' };
  NewReportScreen: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      {/* Global Gradient Background */}
      <LinearGradient
        colors={isDarkMode ? ['#020617', '#0f172a', '#172554'] : ['#f0f9ff', '#e0f2fe', '#bae6fd']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      >
        <View style={[styles.glowOrb, { top: -150, right: -100, backgroundColor: '#fbbf24', opacity: 0.1 }]} />
        <View style={[styles.glowOrb, { bottom: -150, left: -100, backgroundColor: '#1e3a8a', opacity: 0.4 }]} />
      </LinearGradient>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.subtext }]}>{t('home.guard_button')}</Text>
            <Text style={[styles.title, { color: colors.text }]}>Panel de Control</Text>
          </View>
          <TouchableOpacity style={[styles.profileButton, { borderColor: colors.accent }]}>
            <Ionicons name="person" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Quick Actions Grid - Bento Layout */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Registrar Actividad</Text>

          <View style={styles.grid}>

            {/* 1. Registrar Visita (Left Column - Big) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('RegistrationScreen', { type: 'visit' })}
              style={[styles.cardBase, styles.bigCard, {
                borderColor: 'rgba(251, 191, 36, 0.4)', // Gold Border
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.65)'
              }]}
            >
              <BlurView intensity={30} tint={isDarkMode ? 'dark' : 'light'} style={styles.cardInternal}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                  <Ionicons name="people" size={32} color="#fbbf24" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Nueva Visita</Text>
                  <Text style={[styles.cardTag, { color: colors.accent }]}>+ REGISTRAR</Text>
                </View>
                <View style={[styles.arrowCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <Ionicons name="arrow-forward" size={18} color={colors.text} />
                </View>
              </BlurView>
            </TouchableOpacity>

            {/* Right Column: Paquetería & Trabajador */}
            <View style={styles.smallGridColumn}>

              {/* 2. Paquetería */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('RegistrationScreen', { type: 'delivery' })}
                style={[styles.cardBase, styles.smallCard, {
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.65)'
                }]}
              >
                <BlurView intensity={20} tint={isDarkMode ? 'dark' : 'light'} style={styles.cardInternalSmall}>
                  <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Ionicons name="cube-outline" size={24} color="#60a5fa" />
                  </View>
                  <View>
                    <Text style={[styles.cardTitleSmall, { color: colors.text }]}>Paquetería</Text>
                    <Text style={[styles.cardDescSmall, { color: colors.subtext }]}>Amazon, DHL...</Text>
                  </View>
                </BlurView>
              </TouchableOpacity>

              {/* 3. Trabajador */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('RegistrationScreen', { type: 'worker' })}
                style={[styles.cardBase, styles.smallCard, {
                  borderColor: 'rgba(249, 115, 22, 0.3)',
                  backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.65)'
                }]}
              >
                <BlurView intensity={20} tint={isDarkMode ? 'dark' : 'light'} style={styles.cardInternalSmall}>
                  <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                    <Ionicons name="hammer-outline" size={24} color="#fb923c" />
                  </View>
                  <View>
                    <Text style={[styles.cardTitleSmall, { color: colors.text }]}>Servicios</Text>
                    <Text style={[styles.cardDescSmall, { color: colors.subtext }]}>Mantenimiento</Text>
                  </View>
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* 4. Reportar Incidente */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('NewReportScreen')}
              style={[styles.cardBase, styles.wideCard, {
                borderColor: 'rgba(244, 63, 94, 0.3)',
                backgroundColor: isDarkMode ? 'rgba(69, 10, 10, 0.4)' : 'rgba(254, 226, 226, 0.6)'
              }]}
            >
              <BlurView intensity={20} tint={isDarkMode ? 'dark' : 'light'} style={styles.cardInternalRow}>
                <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                  <Ionicons name="alert-circle-outline" size={24} color="#f43f5e" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.cardTitleSmall, { color: colors.text }]}>Reportar Incidente</Text>
                  <Text style={[styles.cardDescSmall, { color: colors.subtext }]}>Robo, Daños, Emergencia</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
              </BlurView>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  glowOrb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    filter: 'blur(60px)',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  scrollContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardBase: {
    borderRadius: 24,
    borderWidth: 0.5, // Thinner, classy border
    overflow: 'hidden',
  },
  bigCard: {
    width: '48%', // Adjusted for 2-column layout
    height: 280, // Taller match
  },
  smallGridColumn: {
    width: '48%',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 280,
  },
  smallCard: {
    width: '100%',
    height: 134, // Half of 280 minus gap approx
  },
  wideCard: {
    width: '100%',
    height: 80,
    marginTop: 16,
  },
  cardInternal: {
    padding: 20,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardInternalSmall: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  cardInternalRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30, // Circle
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxSmall: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  textContainer: {
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600', // Cleaner weight
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  cardTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontSize: 13,
    opacity: 0.8,
  },
  cardDescSmall: {
    fontSize: 12,
    opacity: 0.7,
  },
  cardTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.9,
  },
  arrowCircle: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;