import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './theme/ThemeContext';
import { useI18n } from './theme/I18nContext';

// --- Tipos de datos para las alertas ---
type AlertType = 'error' | 'warning' | 'success';

interface AlertData {
  id: number;
  type: AlertType;
  title: string;
  description: string;
  isReviewed: boolean;
}

const AlertsScreen = () => {
  const { t } = useI18n();

  const initialAlerts: AlertData[] = [
    {
      id: 1,
      type: 'error',
      title: t('general.movement_detected'),
      description: 'Actividad inusual en el Almacén B, cerca del acceso principal.',
      isReviewed: false,
    },
    {
      id: 2,
      type: 'warning',
      title: t('general.camera_disconnected'),
      description: 'La cámara CAM-04 del pasillo norte ha perdido la conexión. Revise la alimentación.',
      isReviewed: false,
    },
    {
      id: 3,
      type: 'success',
      title: t('general.all_clear'),
      description: 'Última revisión del sistema completada sin incidencias a las 04:00 AM.',
      isReviewed: true,
    },
    {
      id: 4,
      type: 'error',
      title: t('alerts.unauthorized_access'),
      description: 'Se ha denegado el acceso en la puerta principal. Verifique el registro.',
      isReviewed: false,
    },
    {
      id: 5,
      type: 'warning',
      title: t('alerts.low_battery'),
      description: 'El sensor de la ventana oeste reporta un nivel de batería inferior al 10%.',
      isReviewed: true,
    },
  ];

  const [alerts, setAlerts] = useState<AlertData[]>(initialAlerts);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const alertTypeColors: Record<AlertType, string> = {
    error: colors.danger,
    warning: '#FACC15',
    success: '#22C55E',
  };

  const handleToggleReview = (id: number) => {
    setAlerts(
      alerts.map(alert =>
        alert.id === id ? { ...alert, isReviewed: !alert.isReviewed } : alert
      )
    );
  };

  const handleMarkAllAsReviewed = () => {
    setAlerts(alerts.map(alert => ({ ...alert, isReviewed: true })));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.mainTitle}>{t('alerts.dashboard_title')}</Text>

        <View style={styles.panel}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            {alerts.map(alert => (
              <Pressable
                key={alert.id}
                style={styles.alertCard}
                onPress={() => handleToggleReview(alert.id)}
              >
                <View
                  style={[
                    styles.alertTypeIcon,
                    { backgroundColor: alertTypeColors[alert.type] },
                  ]}
                />
                <View style={styles.alertTextContainer}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDescription}>{alert.description}</Text>
                </View>
                <Pressable
                  style={styles.reviewIndicatorContainer}
                  onPress={() => handleToggleReview(alert.id)}
                >
                  <View
                    style={[
                      styles.reviewIndicator,
                      alert.isReviewed && styles.reviewIndicatorChecked,
                    ]}
                  />
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsReviewed}
          >
            <Text style={styles.markAllButtonText}>{t('alerts.mark_all_reviewed')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};


// 4. Función que genera los estilos dinámicamente.
// Los estilos ahora usan `colors` para adaptarse al tema.
const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    mainTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    panel: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      padding: 10,
      overflow: 'hidden',
    },
    scrollViewContent: {
      padding: 10,
    },
    alertCard: {
      backgroundColor: colors.card, // Fondo de la tarjeta
      borderRadius: 16,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border, // Borde sutil
    },
    alertTypeIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 15,
    },
    alertTextContainer: {
      flex: 1,
    },
    alertTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    alertDescription: {
      fontSize: 14,
      color: colors.subtext,
      marginTop: 4,
    },
    reviewIndicatorContainer: {
      padding: 10,
      marginLeft: 10,
    },
    reviewIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    reviewIndicatorChecked: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    markAllButton: {
      backgroundColor: colors.accent,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      margin: 10,
    },
    markAllButtonText: {
      color: 'white', // Generalmente el texto sobre un color de acento es blanco
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default AlertsScreen;
