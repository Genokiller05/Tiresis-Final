import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useTheme } from './theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from './theme/I18nContext';

export default function BulletinsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { t } = useI18n();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      // Because of RLS, this will automatically return only 'published' reports for guards via anon key.
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching weekly reports:', error);
      } else {
        setReports(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching bulletins:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const isExpanded = expandedId === item.id;
    const summary = item.summary_json || {};

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDarkMode ? '#333' : '#E5E7EB' }]}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          style={styles.cardHeader}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="document-text-outline" size={24} color={colors.accent} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Semana del {formatDate(item.start_date)}</Text>
              <Text style={[styles.cardDate, { color: colors.subtext }]}>Publicado el {formatDate(item.created_at)}</Text>
            </View>
          </View>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={22} color={colors.subtext} />
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.cardContent, { borderTopColor: isDarkMode ? '#333' : '#F3F4F6' }]}>
            
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumen de Actividad</Text>
            
            <View style={styles.metricsGrid}>
              <View style={[styles.metricBox, { backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
                <Text style={[styles.metricValue, { color: colors.text }]}>{summary.total_reports || 0}</Text>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Reportes</Text>
              </View>
              <View style={[styles.metricBox, { backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                <Text style={[styles.metricValue, { color: colors.text }]}>{summary.status_counts?.completed || 0}</Text>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Completados</Text>
              </View>
              <View style={[styles.metricBox, { backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }]}>
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
                <Text style={[styles.metricValue, { color: colors.text }]}>{summary.status_counts?.in_process || 0}</Text>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>En Proceso</Text>
              </View>
              <View style={[styles.metricBox, { backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }]}>
                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                <Text style={[styles.metricValue, { color: colors.text }]}>{summary.status_counts?.pending || 0}</Text>
                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Pendientes</Text>
              </View>
            </View>

            <View style={styles.highlightsContainer}>
              <View style={styles.highlightRow}>
                <Ionicons name="location-outline" size={18} color={colors.subtext} />
                <Text style={[styles.highlightText, { color: colors.text }]}><Text style={styles.highlightBold}>Área Crítica:</Text> {summary.hottest_area || 'Sin datos'}</Text>
              </View>
              <View style={styles.highlightRow}>
                <Ionicons name="time-outline" size={18} color={colors.subtext} />
                <Text style={[styles.highlightText, { color: colors.text }]}><Text style={styles.highlightBold}>Turno de Riesgo:</Text> {summary.busiest_slot || 'Sin datos'}</Text>
              </View>
            </View>

            {item.admin_notes && (
              <View style={[styles.adminNotesContainer, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
                <View style={styles.adminNotesHeader}>
                  <Ionicons name="megaphone-outline" size={16} color={colors.accent} />
                  <Text style={[styles.adminNotesTitle, { color: colors.accent }]}>Instrucciones del Administrador</Text>
                </View>
                <Text style={[styles.adminNotesText, { color: isDarkMode ? '#E5E7EB' : '#374151' }]}>{item.admin_notes}</Text>
              </View>
            )}

          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Boletines Semanales</Text>
        <Text style={[styles.headerSubtitle, { color: colors.subtext }]}>Reportes operativos e instrucciones</Text>
      </View>
      
      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.subtext }]}>No hay boletines publicados aún.</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]} // Android
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
  },
  cardContent: {
    padding: 16,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricBox: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highlightsContainer: {
    marginBottom: 16,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 14,
    marginLeft: 8,
  },
  highlightBold: {
    fontWeight: 'bold',
  },
  adminNotesContainer: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  adminNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adminNotesTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminNotesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});
