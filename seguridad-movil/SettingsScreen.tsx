import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from './theme/ThemeContext';
import { useI18n } from './theme/I18nContext';
import { useUser } from './context/UserContext';

// --- Tipado para la pila de navegación ---
type RootStackParamList = {
  MainTabs: { screen: 'Home' };
  LoginScreen: undefined;
  SettingsScreen: undefined;
};

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SettingsScreen'
>;

// --- Componente de la pantalla de Configuración ---
const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const { user, logout } = useUser();

  const handleLanguageChange = () => {
    const newLanguage = language === 'es' ? 'en' : 'es';
    setLanguage(newLanguage);
  };

  const handleGoBackToHome = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
  };

  const handleOptionPress = (optionName: string) => {
    Alert.alert(
      t('general.pending_functionality'),
      t('general.in_construction', { optionName: optionName })
    );
  };

  // Creamos los estilos dinámicamente para poder usar los colores del tema.
  const dynamicStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background, // Usar color de fondo del tema
    },
    panel: {
      backgroundColor: colors.card, // Usar color de tarjeta del tema
    },
    headerTitle: {
      color: colors.text, // Usar color de texto del tema
    },
    backIcon: {
      color: colors.text,
    },
    optionRow: {
      backgroundColor: colors.inputBackground, // Un color sutil para el fondo de la fila
    },
    optionText: {
      color: colors.text,
    },
    optionValueText: {
      color: colors.subtext,
    },
    optionArrow: {
      color: colors.subtext,
    },
    logoutButton: {
      // El color de fondo del botón de peligro puede ser diferente
      backgroundColor: isDarkMode ? '#581c1c' : '#fee2e2',
    },
    logoutButtonText: {
      color: colors.danger, // Usar el color de peligro del tema
    },
  });

  return (
    // Usamos los estilos dinámicos que dependen del tema
    <SafeAreaView style={dynamicStyles.safeArea}>
      <View style={styles.container}>
        <View style={[styles.panel, dynamicStyles.panel]}>
          <View style={styles.header}>
            <Pressable onPress={handleGoBackToHome} style={styles.backButton}>
              <Text style={[styles.backIcon, dynamicStyles.backIcon]}>←</Text>
            </Pressable>
            <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>{t('settings.title')}</Text>
            <View style={{ width: 24 }} />
          </View>

          {user && (
            <View style={[styles.profileCard, { backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9' }]}>
              <View style={[styles.avatarContainer, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarText}>
                  {user.nombre ? user.nombre[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'G')}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {user.nombre || 'Guardia'}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.subtext }]}>
                  {user.email}
                </Text>

                {user.area && (
                  <View style={styles.userInfoRow}>
                    <Text style={[styles.userInfoLabel, { color: colors.subtext }]}>{t('settings.area')}:</Text>
                    <Text style={[styles.userInfoValue, { color: colors.text }]}>
                      {user.area}
                    </Text>
                  </View>
                )}

                <View style={[styles.userInfoRow, { marginTop: 4 }]}>
                  <Text style={[styles.userInfoLabel, { color: colors.subtext }]}>ID:</Text>
                  <Text style={[styles.userInfoValue, { color: colors.text }]}>
                    {user.idEmpleado || 'N/A'}
                  </Text>
                </View>
                {user.fechaContratacion && (
                  <View style={styles.userInfoRow}>
                    <Text style={[styles.userInfoLabel, { color: colors.subtext }]}>{t('settings.member_since')}:</Text>
                    <Text style={[styles.userInfoValue, { color: colors.text }]}>
                      {new Date(user.fechaContratacion).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.optionsList}>
            <TouchableOpacity style={[styles.optionRow, dynamicStyles.optionRow]} onPress={handleLanguageChange}>
              <Text style={styles.optionIcon}>🌐</Text>
              <Text style={[styles.optionText, dynamicStyles.optionText]}>{t('settings.language')}</Text>
              <View style={styles.optionRightContent}>
                <Text style={[styles.optionValueText, dynamicStyles.optionValueText]}>
                  {language === 'es' ? t('settings.language_es') : t('settings.language_en')}
                </Text>
                <Text style={[styles.optionArrow, dynamicStyles.optionArrow]}>›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionRow, dynamicStyles.optionRow]} onPress={() => handleOptionPress(t('settings.notifications'))}>
              <Text style={styles.optionIcon}>🔔</Text>
              <Text style={[styles.optionText, dynamicStyles.optionText]}>{t('settings.notifications')}</Text>
              <Text style={[styles.optionArrow, dynamicStyles.optionArrow]}>›</Text>
            </TouchableOpacity>

            <View style={[styles.optionRow, dynamicStyles.optionRow]}>
              <Text style={styles.optionIcon}>🌙</Text>
              <Text style={[styles.optionText, dynamicStyles.optionText]}>{t('settings.dark_mode')}</Text>
              <Switch
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isDarkMode ? colors.accent : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleTheme}
                value={isDarkMode}
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.logoutButton, dynamicStyles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.logoutButtonIcon}>🚪</Text>
            <Text style={[styles.logoutButtonText, dynamicStyles.logoutButtonText]}>{t('settings.logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};


// Estilos base que no dependen del tema
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  panel: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  optionsList: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionIcon: {
    fontSize: 22,
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  optionRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionValueText: {
    fontSize: 16,
    marginRight: 10,
  },
  optionArrow: {
    fontSize: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
  },
  logoutButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  userInfoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  userInfoLabel: {
    fontSize: 12,
    marginRight: 6,
    fontWeight: '600',
  },
  userInfoValue: {
    fontSize: 12,
  },
});

export default SettingsScreen;
