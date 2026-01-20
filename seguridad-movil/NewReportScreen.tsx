import React, { useState } from 'react';
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
import { useTheme } from './theme/ThemeContext';
import { useI18n } from './theme/I18nContext';

import { addReport } from './services/dataService';

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
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);

  const incidentTypes = [
    'Intrusión detectada',
    'Actividad sospechosa',
    'Fallo de equipo (cámara, sensor, etc.)',
    'Emergencia médica',
    'Incendio',
    'Vandalismo',
    'Accidente',
  ];

  const [incidentType, setIncidentType] = useState<string | null>(null);
  const [isIncidentModalVisible, setIncidentModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<string | null>(null);

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

    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      setEvidence(pickerResult.assets[0].uri);
    }
  };

  const handleSubmitReport = () => {
    if (!incidentType || !description) {
      Alert.alert(t('new_report.error_title'), t('new_report.error_message'));
      return;
    }

    const newReport = {
      type: incidentType,
      date: new Date().toLocaleString(),
      status: 'Enviado' as const,
      summary: description,
      evidence: evidence || undefined,
    };

    addReport(newReport);

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
            <Text style={styles.headerTitle}>{t('new_report.title')}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.formPanel}>
            <Text style={styles.label}>{t('new_report.incident_type')}</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIncidentModalVisible(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {incidentType || t('new_report.select_incident_type')}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>

            <Text style={styles.label}>{t('new_report.detailed_description')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('new_report.add_details')}
              placeholderTextColor={colors.subtext}
              multiline={true}
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
        transparent={true}
        visible={isIncidentModalVisible}
        onRequestClose={() => setIncidentModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIncidentModalVisible(false)}>
          <View style={styles.incidentModalContent}>
            {incidentTypes.map((type, index) => (
              <TouchableOpacity
                key={index}
                style={styles.incidentOption}
                onPress={() => {
                  setIncidentType(type);
                  setIncidentModalVisible(false);
                }}
              >
                <Text style={styles.incidentOptionText}>{type}</Text>
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
