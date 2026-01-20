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

  const report = getReportById(route.params.reportId);

  if (!report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>{t('report_detail.not_found')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColors: Record<ReportData['status'], string> = {
    Enviado: colors.accent,
    'En Revisión': '#F59E0B',
    Resuelto: '#10B981',
  };

  const statusTranslations = {
    Enviado: t('reports.status_sent'),
    'En Revisión': t('reports.status_in_review'),
    Resuelto: t('reports.status_resolved'),
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t('report_detail.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.panel}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('report_detail.report_id')}</Text>
            <Text style={styles.detailValue}>#{report.id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('report_detail.incident_type')}</Text>
            <Text style={styles.detailValue}>{report.type}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('report_detail.date')}</Text>
            <Text style={styles.detailValue}>{report.date}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('report_detail.status')}</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColors[report.status] }]} />
              <Text style={[styles.statusText, { color: statusColors[report.status] }]}>
                {statusTranslations[report.status]}
              </Text>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.detailLabel}>{t('report_detail.summary')}</Text>
            <Text style={styles.descriptionText}>{report.summary}</Text>
          </View>

          <View style={styles.evidenceContainer}>
            <Text style={styles.detailLabel}>{t('report_detail.evidence')}</Text>
            {report.evidence ? (
              <Image source={{ uri: report.evidence }} style={styles.evidenceImage} />
            ) : (
              <Text style={styles.noEvidenceText}>{t('report_detail.no_evidence')}</Text>
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
