import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from './theme/ThemeContext';
import { useI18n } from './theme/I18nContext';
import { useUser } from './context/UserContext';
import { Image } from 'react-native';

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
  const { user } = useUser();

  const styles = createStyles(colors);

  const handleGoBackToHome = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  // Read all fields with fallbacks for both naming conventions
  const guardName = user?.nombre || user?.full_name || 'Agente';
  const guardId = user?.idEmpleado || user?.document_id || 'ID Desconocido';
  let guardPhoto = user?.foto || user?.photo_url || null;
  const guardEmail = user?.email || 'N/A';
  const guardArea = user?.area || 'Sin área asignada';
  const guardTelefono = user?.telefono || user?.phone || 'No registrado';
  const guardDireccion = user?.direccion || 'No registrada';
  const guardEstado = user?.estado || 'Sin estado';

  // Fix photo URL for local server / emulator / physical device
  if (guardPhoto && !guardPhoto.startsWith('http')) {
    // Local server path like /uploads/photo-123.jpg
    // For Android emulator use 10.0.2.2, for physical device use your computer's local IP
    const Platform = require('react-native').Platform;
    const localHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    guardPhoto = `http://${localHost}:3000${guardPhoto}`;
  }

  // Status color logic
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'En servicio': return '#22c55e';
      case 'Fuera de servicio': return '#ef4444';
      case 'En descanso': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  const statusColor = getStatusColor(guardEstado);

  // Initials for avatar fallback
  const initials = guardName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.panel}>
            <View style={styles.header}>
              <Pressable onPress={handleGoBackToHome} style={styles.backButton}>
                <Text style={styles.backIcon}>←</Text>
              </Pressable>
              <Text style={styles.headerTitle}>{t('home.profile_button')}</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Profile Header with Avatar */}
            <View style={styles.profileHeader}>
              {guardPhoto ? (
                <Image source={{ uri: guardPhoto }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <Text style={styles.guardName}>{guardName}</Text>
              <Text style={styles.guardId}>ID: {guardId}</Text>

              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '60' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{guardEstado}</Text>
              </View>
            </View>

            {/* Info Cards */}
            <View style={styles.infoSection}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Nombre Completo</Text>
                <Text style={styles.infoValue}>{guardName}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>ID de Guardia</Text>
                <Text style={styles.infoValue}>{guardId}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{guardEmail}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Área Asignada</Text>
                <Text style={styles.infoValue}>{guardArea}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{guardTelefono}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Dirección</Text>
                <Text style={styles.infoValue}>{guardDireccion}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
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
      marginBottom: 20,
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
      marginBottom: 24,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.border,
      marginBottom: 15,
    },
    avatarFallback: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.accent,
    },
    avatarInitials: {
      color: '#ffffff',
      fontSize: 36,
      fontWeight: 'bold',
    },
    guardName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
    },
    guardId: {
      fontSize: 16,
      color: colors.subtext,
      marginTop: 4,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '700',
    },
    infoSection: {
      marginBottom: 10,
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
      fontSize: 12,
      color: colors.subtext,
      marginBottom: 4,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
  });

export default ProfileScreen;