import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from './theme/ThemeContext';
import { useI18n } from './theme/I18nContext';
import { getAllReports, Report as ReportData } from './services/dataService';

// --- Tipado para la pila de navegación ---
type RootStackParamList = {
  NewReportScreen: undefined;
  MainTabs: undefined;
  ReportDetail: { reportId: string };
};

type ReportsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList
>;

const ReportsScreen = () => {
  const navigation = useNavigation<ReportsScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);
  const [reports, setReports] = useState<ReportData[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadReports = async () => {
        try {
          const allReports = await getAllReports();
          if (allReports.length > 0) {
            console.log('Sample report keys:', Object.keys(allReports[0]));
            // console.log('Sample report:', JSON.stringify(allReports[0], null, 2));
          }
          setReports(allReports.sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || a.fechaHora || 0).getTime();
            const dateB = new Date(b.created_at || b.fechaHora || 0).getTime();
            return dateB - dateA;
          }));
        } catch (error) {
          console.error('Error loading reports:', error);
        }
      };
      loadReports();
    }, [])
  );

  const statusColors: Record<string, string> = {
    '1': '#F59E0B', // Pendiente
    'Pendiente': '#F59E0B',
    '2': '#3B82F6', // En Revisión
    'En Revisión': '#3B82F6',
    'Enviado': colors.accent,
    '3': '#10B981', // Resuelto
    'Resuelto': '#10B981',
  };

  const statusTranslations: Record<number | string, string> = {
    1: t('reports.status_sent') || 'Pendiente',
    'Pendiente': t('reports.status_sent') || 'Pendiente',
    'Enviado': t('reports.status_sent') || 'Enviado',
    2: t('reports.status_in_review') || 'En Revisión',
    'En Revisión': t('reports.status_in_review') || 'En Revisión',
    3: t('reports.status_resolved') || 'Resuelto',
    'Resuelto': t('reports.status_resolved') || 'Resuelto',
  };

  const renderReportItem = ({ item }: { item: any }) => (
    <Pressable style={styles.reportCard} onPress={() => navigation.navigate('ReportDetail', { reportId: String(item.id) })}>
      <View style={styles.reportIconContainer}>
        <Text style={styles.reportIcon}>📋</Text>
      </View>
      <View style={styles.reportTextContainer}>
        <Text style={styles.reportType}>{item.report_type?.name || item.tipo || 'Reporte'}</Text>
        <Text style={styles.reportSummary}>{item.short_description || item.description || item.detalles?.descripcion || 'Sin descripción'}</Text>
        <Text style={styles.reportDate}>{new Date(item.created_at || item.fechaHora).toLocaleString()}</Text>
      </View>
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: statusColors[item.status_id] || statusColors[item.estado] || '#94a3b8' }]} />
        <Text style={[styles.statusText, { color: statusColors[item.status_id] || statusColors[item.estado] || '#94a3b8' }]}>
          {statusTranslations[item.status_id] || statusTranslations[item.estado] || item.estado || 'Pendiente'}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.mainTitle}>{t('reports.management_title')}</Text>
        <View style={styles.panel}>
          <FlatList
            data={reports}
            renderItem={renderReportItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewReportScreen')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// 4. Función que genera los estilos dinámicamente.
// Ahora la pantalla y sus componentes se adaptan al tema claro/oscuro.
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
      overflow: 'hidden',
    },
    listContent: {
      padding: 20,
    },
    reportCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reportIconContainer: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 12,
      marginRight: 15,
    },
    reportIcon: {
      fontSize: 24,
    },
    reportTextContainer: {
      flex: 1,
    },
    reportType: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    reportSummary: {
      fontSize: 14,
      color: colors.subtext,
      marginTop: 4,
    },
    reportDate: {
      fontSize: 12,
      color: colors.subtext,
      marginTop: 8,
    },
    statusContainer: {
      alignItems: 'center',
      marginLeft: 10,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginBottom: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    fab: {
      position: 'absolute',
      width: 60,
      height: 60,
      alignItems: 'center',
      justifyContent: 'center',
      right: 30,
      bottom: 30,
      backgroundColor: colors.accent,
      borderRadius: 30,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    fabIcon: {
      fontSize: 30,
      color: 'white',
    },
  });

export default ReportsScreen;
