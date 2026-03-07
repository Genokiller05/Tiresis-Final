import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator'; // Added ImageManipulator
import { useTheme } from './theme/ThemeContext';
import { useI18n } from './theme/I18nContext';
import { useUser } from './context/UserContext';

import {
  createReport as addReport,
  fetchReportTypes,
  fetchReportStatuses,
  fetchPriorities,
  fetchSites,
  uploadEntryEvidence,
  linkEvidenceToReport
} from './services/dataService';
// --- Tipado de navegación ---
type RootStackParamList = {
  MainTabs: { screen: 'Reports' };
};

type NewReportScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

const NewReportScreen = () => {
  const navigation = useNavigation<NewReportScreenNavigationProp>();
  const { user } = useUser();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);

  // Hardcoded types as fallback/primary since DB table might be inaccessible
  const incidentTypes = [
    { id: 1, name: 'Incidente', code: 'incident' },
    { id: 2, name: 'Novedad', code: 'novelty' },
    { id: 3, name: 'Rondín', code: 'patrol' },
    { id: 4, name: 'Alerta recibida', code: 'received_alert' },
    { id: 37, name: 'Actividad sospechosa', code: 'suspicious_activity' },
    { id: 38, name: 'Daño a propiedad', code: 'property_damage' },
    { id: 39, name: 'Emergencia médica', code: 'medical_emergency' },
  ];

  // We will still use state for statuses, priorities, and sites, but they will be fetched differently or default.
  const [statuses, setStatuses] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  // Selected IDs
  const [selectedType, setSelectedType] = useState<any | null>(null);
  const [isIncidentModalVisible, setIncidentModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<string | null>(null);

  // Áreas
  const areasList = [
    "Edificio Central",
    "Área Deportiva",
    "Entrada Principal",
    "Nuevo Edificio",
    "Entrada Trasera",
    "Estacionamiento",
    "Edificio A",
    "Edificio B",
    "Oficinas",
    "Ronda Perimetral"
  ];
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isAreaModalVisible, setAreaModalVisible] = useState(false);

  // We skip fetching specific catalogs for now to avoid errors if tables are missing/hidden
  // But we still try to fetch sites if possible, or use a default.
  useEffect(() => {
    // Optional: Fetch sites if needed, but keeping it simple to ensure it loads
    const loadSites = async () => {
      try {
        // If fetchSites fails, we just don't have sites.
        // We can proceed with a default ID if the DB allows.
        const sitesData = await fetchSites();
        setSites(sitesData || []);
      } catch (e) { console.log('Sites fetch skipped/failed'); }
    };
    loadSites();

    // Set default statuses and priorities if not fetched
    // These are hardcoded as a fallback, similar to incidentTypes
    setStatuses([
      { id: 1, name: 'Pendiente', code: 'pending' },
      { id: 2, name: 'En progreso', code: 'in_progress' },
      { id: 3, name: 'Resuelto', code: 'resolved' },
      { id: 4, name: 'Cerrado', code: 'closed' }
    ]);
    setPriorities([
      { id: 1, name: 'Baja', code: 'low' },
      { id: 2, name: 'Media', code: 'medium' },
      { id: 3, name: 'Alta', code: 'high' }
    ]);
  }, []);

  const handleGoBackToHome = () => {
    navigation.navigate('MainTabs', { screen: 'Reports' });
  };

  const handlePickEvidence = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('new_report.permission_required'),
        t('new_report.permission_message')
      );
      return;
    }

    try {
      const pickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const imageUri = pickerResult.assets[0].uri;

        // Use ImageManipulator for cropping
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ crop: { originX: 0, originY: 0, width: pickerResult.assets[0].width, height: pickerResult.assets[0].height } }], // Initial crop to full image
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );

        // handle different versions of ImageManipulator result
        if (manipulatedImage.uri) {
          setEvidence(manipulatedImage.uri);
        }
      }
    } catch (e) {
      console.error("Camera error:", e);
      Alert.alert("Error", "No se pudo abrir la cámara.");
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedType || !description || !selectedArea) {
      Alert.alert(t('new_report.error_title'), 'Por favor completa todos los campos requeridos, incluyendo el Área.');
      return;
    }

    const guardId = user?.id || user?.idEmpleado;

    if (!guardId) {
      console.error("User context missing ID and idEmpleado:", user);
      Alert.alert("Error", "No se ha identificado al usuario. Por favor cierre sesión e intente de nuevo.");
      return;
    }

    try {
      let evidenceId = null;
      let evidenceUrl = null;

      if (evidence) {
        const uploadResult = await uploadEntryEvidence(evidence, guardId);
        if (!uploadResult) {
          Alert.alert('Advertencia', 'No se pudo subir la evidencia. Se enviará el reporte sin foto.');
        } else {
          evidenceId = uploadResult.id;
          evidenceUrl = uploadResult.url;
        }
      }

      // Logic to resolve IDs
      const pendingStatus = statuses.find(s => s.code === 'pending') || statuses[0];
      const defaultPriority = priorities.find(p => p.code === 'medium') || priorities[0];

      // Resolve Site ID: Use first available site if not assigned
      const siteId = sites.length > 0 ? sites[0].id : null;

      if (!siteId) {
        Alert.alert('Error', 'No hay sitios disponibles para asignar el reporte.');
        return;
      }

      const guardInfo = user ? ` | Guardia: ${user.nombre} (ID: ${user.idEmpleado} / ${user.email})` : '';
      const newReportData = {
        site_id: siteId,
        created_by_guard_id: guardId,
        short_description: `Area: ${selectedArea}${guardInfo} | ${description}${evidenceUrl ? ` | Evidencia: ${evidenceUrl}` : ''}`,
        report_type_id: selectedType?.id || 1,
        status_id: pendingStatus?.id || 1,
        priority_id: defaultPriority?.id || 1,
      };

      const newReport = await addReport(newReportData as any);

      if (newReport && evidenceId) {
        await linkEvidenceToReport(newReport.id, evidenceId);
      }

      Alert.alert(
        t('new_report.success_title'),
        t('new_report.success_message'),
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Reports' }),
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo enviar el reporte: ' + (error as any).message);
    }
  };

  const evidenceSelectedText = evidence
    ? `${t('new_report.file_selected')} ${evidence.split('/').pop()}`
    : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={handleGoBackToHome} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <View style={{ flex: 1, marginHorizontal: 12, alignItems: 'center' }}>
              <Text style={styles.headerTitle} adjustsFontSizeToFit numberOfLines={1}>{t('new_report.title')}</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.formPanel}>
            <Text style={styles.label}>{t('new_report.incident_type')}</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIncidentModalVisible(true)}
            >
              <Text style={[styles.dropdownButtonText, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit>
                {selectedType ? selectedType.name : t('new_report.select_incident_type')}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Área Asignada</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setAreaModalVisible(true)}
            >
              <Text style={[styles.dropdownButtonText, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit>
                {selectedArea ? selectedArea : 'Seleccionar Área'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>

            <Text style={styles.label}>{t('new_report.detailed_description')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('new_report.add_details')}
              placeholderTextColor={colors.subtext}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>{t('new_report.evidence')}</Text>
            <Pressable style={styles.evidenceBox} onPress={handlePickEvidence}>
              <Text style={styles.evidenceIcon}>📸</Text>
              <Text style={styles.evidenceText}>{t('new_report.take_evidence_button')}</Text>
              <Text style={styles.evidenceHelperText}>{t('new_report.evidence_helper_camera')}</Text>
              {evidence && (
                <Text style={styles.evidenceSelectedText}>{evidenceSelectedText}</Text>
              )}
            </Pressable>

            <TouchableOpacity style={styles.sendReportButton} onPress={handleSubmitReport}>
              <Text style={styles.sendReportButtonText}>{t('new_report.send_button')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal para seleccionar Tipo de Incidente */}
      <Modal
        animationType="slide"
        transparent
        visible={isIncidentModalVisible}
        onRequestClose={() => setIncidentModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIncidentModalVisible(false)}>
          <View style={styles.incidentModalContent}>
            {incidentTypes.map((type: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.incidentOption}
                onPress={() => {
                  setSelectedType(type);
                  setIncidentModalVisible(false);
                }}
              >
                <Text style={styles.incidentOptionText}>{type.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.incidentOption, styles.incidentCancelOption]}
              onPress={() => setIncidentModalVisible(false)}
            >
              <Text style={styles.incidentOptionText}>{t('general.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Modal para seleccionar Área */}
      <Modal
        animationType="slide"
        transparent
        visible={isAreaModalVisible}
        onRequestClose={() => setAreaModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAreaModalVisible(false)}>
          <View style={styles.incidentModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {areasList.map((area, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.incidentOption}
                  onPress={() => {
                    setSelectedArea(area);
                    setAreaModalVisible(false);
                  }}
                >
                  <Text style={styles.incidentOptionText}>{area}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.incidentOption, styles.incidentCancelOption]}
                onPress={() => setAreaModalVisible(false)}
              >
                <Text style={styles.incidentOptionText}>{t('general.cancel')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

// 4. Función que genera los estilos dinámicamente.
// La UI del formulario ahora se adapta al tema.
const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollViewContent: {
      flexGrow: 1,
      paddingVertical: 20,
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
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
    formPanel: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
    label: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 10,
      fontWeight: '500',
    },
    dropdownButton: {
      backgroundColor: colors.inputBackground,
      padding: 15,
      borderRadius: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dropdownButtonText: {
      color: colors.text,
      fontSize: 16,
    },
    dropdownIcon: {
      color: colors.subtext,
      fontSize: 12,
    },
    textArea: {
      backgroundColor: colors.inputBackground,
      padding: 15,
      borderRadius: 10,
      color: colors.text,
      fontSize: 16,
      textAlignVertical: 'top',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 100,
    },
    evidenceBox: {
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      marginBottom: 20,
    },
    evidenceIcon: {
      fontSize: 40,
      color: colors.subtext,
      marginBottom: 10,
    },
    evidenceText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    evidenceHelperText: {
      color: colors.subtext,
      fontSize: 12,
      textAlign: 'center',
    },
    evidenceSelectedText: {
      color: '#22C55E', // Verde para indicar éxito
      fontSize: 12,
      marginTop: 10,
      textAlign: 'center',
    },
    sendReportButton: {
      backgroundColor: colors.accent,
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 10,
    },
    sendReportButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    incidentModalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 10,
      paddingBottom: 20,
      maxHeight: '60%',
    },
    incidentOption: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    incidentOptionText: {
      color: colors.text,
      fontSize: 18,
    },
    incidentCancelOption: {
      borderBottomWidth: 0,
      marginTop: 10,
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
    },
  });

export default NewReportScreen;