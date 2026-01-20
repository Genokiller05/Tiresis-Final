import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from './theme/ThemeContext';
import { useI18n } from './theme/I18nContext';

// --- Tipado para la pila de navegación ---
type RootStackParamList = {
  MainTabs: { screen: 'Home' };
  ProfileScreen: undefined;
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProfileScreen'
>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);

  const handleGoBackToHome = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Pressable onPress={handleGoBackToHome} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{t('home.profile_button')}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.avatar} />
            <Text style={styles.guardName}>Carlos Rodriguez</Text>
            <Text style={styles.guardId}>ID de Guardia: G734-9B</Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Nombre Completo</Text>
              <Text style={styles.infoValue}>Carlos Rodriguez</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>ID de Guardia</Text>
              <Text style={styles.infoValue}>G734-9B</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>carlos.r@seguridadpro.com</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// 4. Función que genera los estilos dinámicamente.
// Los componentes ahora usarán los colores del tema y se adaptarán.
const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    panel: {
      backgroundColor: colors.card,
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
      color: colors.text,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: 30,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.border, // Placeholder para el avatar
      marginBottom: 15,
    },
    guardName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    guardId: {
      fontSize: 16,
      color: colors.subtext,
      marginTop: 4,
    },
    infoSection: {
      marginBottom: 30,
    },
    infoBox: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 15,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
  });

export default ProfileScreen;