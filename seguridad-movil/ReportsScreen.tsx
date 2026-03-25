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
import { supabase } from './lib/supabaseClient';

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

  React.useEffect(() => {
    const channel = supabase
      .channel('reports-realtime-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          setReports((prevReports) => {
            if (payload.eventType === 'INSERT') {
              const newReports = [payload.new as ReportData, ...prevReports];
              return newReports.sort((a: any, b: any) => {
                const dateA = new Date(a.created_at || a.fechaHora || 0).getTime();
                const dateB = new Date(b.created_at || b.fechaHora || 0).getTime();
                return dateB - dateA;
              });
            } else if (payload.eventType === 'UPDATE') {
              return prevReports.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r);
            } else if (payload.eventType === 'DELETE') {
              return prevReports.filter(r => r.id !== payload.old.id);
            }
            return prevReports;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resolveStatusColor = (statusId: any, estadoStr: any) => {
    const id = String(statusId);
    const txt = String(estadoStr || '');
    if (id === '31' || txt === 'Cancelado') return '#EF4444'; // Rojo
    if (id === '32' || txt === 'Suspendido') return '#6B7280'; // Gris
    if (id === '3' || txt === 'Completado' || txt === 'Resuelto') return '#10B981';
    if (id === '2' || txt === 'En proceso') return '#3B82F6';
    return '#F59E0B'; // Pendiente amarillo
  };

  const resolveStatusText = (statusId: any, estadoStr: any) => {
    const id = String(statusId);
    const txt = String(estadoStr || '');
    if (id === '31' || txt === 'Cancelado') return 'Cancelado';
    if (id === '32' || txt === 'Suspendido') return 'Suspendido';
    if (id === '3' || txt === 'Completado' || txt === 'Resuelto') return 'Completado';
    if (id === '2' || txt === 'En proceso' || txt === 'En Revisión') return 'En proceso';
    if (txt === 'Enviado') return 'Enviado';
    return 'Pendiente';
  };

  const renderReportItem = ({ item }: { item: any }) => {
    let summary = item.short_description || item.description || item.detalles?.descripcion || 'Sin descripción';
    let areaTag = null;

    if (typeof summary === 'string') {
      const guardMatch = summary.match(/Guardia: ([^|]+)/);
      if (guardMatch && guardMatch[2] !== undefined) {
        // just safely match it but we really want `guardMatch[0]`
      }
      if (guardMatch) {
        summary = summary.replace(guardMatch[0], '').replace(/\|\s*\|\s*/, '|').replace(/\|\s*$/, '').trim();
      }

      if (summary.includes('|')) {
        const parts = summary.split('|');
        if (parts[0].trim().startsWith('Area:')) {
          areaTag = parts[0].trim().substring(5).trim();
          summary = parts.slice(1).join('|').trim();
        }
      }

      const evidenceMatch = summary.match(/Evidencia: (http[s]?:\/\/[^\s]+)/);
      if (evidenceMatch && evidenceMatch[1]) {
        summary = summary.replace(evidenceMatch[0], '').replace(/\|\s*$/, '').trim();
      }

      summary = summary.replace(/^\|\s*/, '').trim();
    }

    return (
      <Pressable style={styles.reportCard} onPress={() => navigation.navigate('ReportDetail', { reportId: String(item.id) })}>
        <View style={styles.reportIconContainer}>
          <Text style={styles.reportIcon}>📋</Text>
        </View>
        <View style={styles.reportTextContainer}>
          <Text style={styles.reportType} numberOfLines={1}>{item.report_type?.name || item.tipo || 'Reporte'}</Text>
          {areaTag && <Text style={{ fontSize: 12, color: colors.accent, fontWeight: 'bold', marginTop: 2 }} numberOfLines={1}>{areaTag}</Text>}
          <Text style={styles.reportSummary} numberOfLines={2}>{summary}</Text>
          <Text style={styles.reportDate} numberOfLines={1}>{new Date(item.created_at || item.fechaHora).toLocaleString()}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: resolveStatusColor(item.status_id, item.estado) }]} />
          <Text style={[styles.statusText, { color: resolveStatusColor(item.status_id, item.estado) }]}>
            {resolveStatusText(item.status_id, item.estado)}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.mainTitle}>{t('reports.management_title')}</Text>
        <View style={styles.panel}>
          <FlatList
            data={reports}
            extraData={reports}
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
