import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from './theme/ThemeContext';
import { useI18n } from './theme/I18nContext';
import { getReportById, Report as ReportData } from './services/dataService';

// --- Tipado para los parámetros de la ruta ---
type RootStackParamList = {
  ReportDetail: { reportId: number };
};

type ReportDetailRouteProp = RouteProp<RootStackParamList, 'ReportDetail'>;

const ReportDetailScreen = () => {
  const route = useRoute<ReportDetailRouteProp>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);

  const [report, setReport] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const data = await getReportById(String(route.params.reportId));
      setReport(data);
      setLoading(false);
    };
    fetchReport();
  }, [route.params.reportId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Cargando reporte...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Reporte no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Fallback states since the schema changed
  const displayStatus = report.status_id ? 'Notificado' : 'Pendiente';
  const displayType = report.report_type_id ? 'Reporte del Sistema' : 'Incidente de Seguridad';
  const displayDate = report.created_at ? new Date(report.created_at).toLocaleString() : 'Fecha desconocida';

  // Using short_description as both summary, and parsing out evidence if appended
  let descriptionText = report.short_description || 'Sin descripción detallada';
  let evidenceUri = null;
  const evidenceMatch = descriptionText.match(/Evidencia: (http[s]?:\/\/[^\s]+)/);
  if (evidenceMatch && evidenceMatch[1]) {
    evidenceUri = evidenceMatch[1];
    descriptionText = descriptionText.replace(evidenceMatch[0], '').trim();
  }

  let assignedArea = 'Área Asignada (Desconocida)';
  let guardInfo = 'Guardia Registrado';

  const guardMatch = descriptionText.match(/Guardia: ([^|]+)/);
  if (guardMatch && guardMatch[1]) {
    guardInfo = guardMatch[1].trim();
    descriptionText = descriptionText.replace(guardMatch[0], '').replace(/\|\s*\|\s*/, '|').replace(/\|\s*$/, '').trim();
  }

  if (descriptionText.includes('|')) {
    const parts = descriptionText.split('|');
    if (parts[0].trim().startsWith('Area:')) {
      assignedArea = parts[0].trim().substring(5).trim();
      descriptionText = parts.slice(1).join('|').trim();
    }
  }

  const statusColors: Record<string, string> = {
    Enviado: colors.accent,
    'En Revisión': '#F59E0B',
    Resuelto: '#10B981',
    Pendiente: '#94a3b8',
    Notificado: '#3B82F6'
  };

  const statusTranslations: Record<string, string> = {
    Enviado: 'Enviado',
    'En Revisión': 'En revisión',
    Resuelto: 'Resuelto',
    Pendiente: 'Pendiente',
    Notificado: 'Notificado'
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={{ flex: 1, marginHorizontal: 12, alignItems: 'center' }}>
            <Text style={styles.headerTitle} adjustsFontSizeToFit numberOfLines={1}>Detalle del Reporte</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.panel}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID del Reporte</Text>
            <Text style={styles.detailValue}>#{report.id.substring(0, 8)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Guardia / Usuario</Text>
            <Text style={[styles.detailValue, { flexShrink: 1 }]} numberOfLines={2} adjustsFontSizeToFit>{guardInfo}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tipo de Incidente</Text>
            <Text style={styles.detailValue}>{displayType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Área Asignada</Text>
            <Text style={[styles.detailValue, { flexShrink: 1 }]} numberOfLines={2} adjustsFontSizeToFit>{assignedArea}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha</Text>
            <Text style={styles.detailValue}>{displayDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColors[displayStatus] || statusColors['Pendiente'] }]} />
              <Text style={[styles.statusText, { color: statusColors[displayStatus] || statusColors['Pendiente'] }]}>
                {statusTranslations[displayStatus] || displayStatus}
              </Text>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.detailLabel}>Resumen</Text>
            <Text style={styles.descriptionText}>{descriptionText}</Text>
          </View>

          <View style={styles.evidenceContainer}>
            <Text style={styles.detailLabel}>Evidencia</Text>
            {evidenceUri ? (
              <Image source={{ uri: evidenceUri }} style={styles.evidenceImage} />
            ) : (
              <Text style={styles.noEvidenceText}>Sin evidencia adjunta</Text>
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollViewContent: {
    padding: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  panel: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.subtext,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    paddingVertical: 15,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginTop: 10,
  },
  evidenceContainer: {
    marginTop: 20,
  },
  evidenceImage: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginTop: 10,
    backgroundColor: colors.inputBackground,
  },
  noEvidenceText: {
    fontSize: 16,
    color: colors.subtext,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
});

export default ReportDetailScreen;
