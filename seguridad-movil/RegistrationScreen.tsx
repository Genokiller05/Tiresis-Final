import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from './theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// --- Tipos para la navegación ---
type RegistrationRouteParams = {
    type: 'visit' | 'delivery' | 'worker';
};

type RootStackParamList = {
    RegistrationScreen: RegistrationRouteParams;
};

type RegistrationScreenRouteProp = RouteProp<RootStackParamList, 'RegistrationScreen'>;

const RegistrationScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<RegistrationScreenRouteProp>();
    const { type } = route.params;
    const { colors, isDarkMode } = useTheme();

    // Estados del formulario
    const [name, setName] = useState('');
    const [purpose, setPurpose] = useState(''); // Empresa o Motivo
    const [company, setCompany] = useState(''); // Solo para worker/delivery
    const [evidenceUri, setEvidenceUri] = useState<string | null>(null);

    // Configuración dinámica según el tipo
    const getScreenConfig = () => {
        switch (type) {
            case 'visit':
                return {
                    title: 'Registrar Visita',
                    icon: 'people',
                    color: '#fbbf24', // Gold
                    desc: 'Registro de invitados a la residencia.'
                };
            case 'delivery':
                return {
                    title: 'Paquetería / Entrega',
                    icon: 'cube',
                    color: '#3b82f6', // Blue
                    desc: 'Registro de entregas (Amazon, DHL, Comida...)'
                };
            case 'worker':
                return {
                    title: 'Trabajador / Mantenimiento',
                    icon: 'hammer',
                    color: '#f97316', // Orange
                    desc: 'Registro de reparaciones y personal de servicio.'
                };
            default:
                return { title: 'Registro', icon: 'pencil', color: colors.accent, desc: '' };
        }
    };

    const config = getScreenConfig();

    // Función para abrir la cámara
    const handleCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Se requiere acceso a la cámara para capturar la evidencia.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setEvidenceUri(result.assets[0].uri);
        }
    };

    const handleSubmit = () => {
        if (!name || !evidenceUri) {
            Alert.alert('Faltan Datos', 'El nombre y la fotografía (INE/Rostro) son obligatorios.');
            return;
        }
        // Aquí iría la lógica de guardado en base de datos
        Alert.alert('Registro Exitoso', 'La entrada ha sido registrada correctamente.');
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            {/* Fondo Global */}
            <LinearGradient
                colors={isDarkMode ? ['#020617', '#0f172a', '#172554'] : ['#f0f9ff', '#e0f2fe', '#bae6fd']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{config.title}</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Header Card */}
                        <View style={[styles.infoCard, { backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255,255,255,0.7)', borderColor: config.color }]}>
                            <View style={[styles.iconBox, { backgroundColor: config.color }]}>
                                <Ionicons name={config.icon as any} size={28} color="white" />
                            </View>
                            <Text style={[styles.descText, { color: colors.subtext }]}>{config.desc}</Text>
                        </View>

                        {/* Formulario Glassmorphism */}
                        <BlurView intensity={30} tint={isDarkMode ? 'dark' : 'light'} style={[styles.formContainer, { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' }]}>

                            {/* Captura de Evidencia (INE) */}
                            <Text style={[styles.sectionLabel, { color: colors.accent }]}>Evidencia Obligatoria (INE/Rostro)</Text>
                            <TouchableOpacity onPress={handleCamera} style={[styles.cameraBox, { borderColor: evidenceUri ? '#22c55e' : colors.border }]}>
                                {evidenceUri ? (
                                    <Image source={{ uri: evidenceUri }} style={styles.previewImage} />
                                ) : (
                                    <>
                                        <Ionicons name="camera" size={40} color={colors.subtext} />
                                        <Text style={[styles.cameraText, { color: colors.subtext }]}>Toque para escanear Identificación</Text>
                                    </>
                                )}
                                {evidenceUri && (
                                    <View style={styles.checkBadge}>
                                        <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Campos de Texto */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Nombre Completo</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                                    placeholder="Ej. Juan Pérez"
                                    placeholderTextColor={colors.subtext}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            {(type === 'delivery' || type === 'worker') && (
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.text }]}>Empresa / Compañía</Text>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                                        placeholder={type === 'delivery' ? "Ej. Amazon, DHL" : "Ej. Mantenimiento S.A."}
                                        placeholderTextColor={colors.subtext}
                                        value={company}
                                        onChangeText={setCompany}
                                    />
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>
                                    {type === 'visit' ? 'A quién visita / Departamento' : 'Motivo / Descripción'}
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                                    placeholder={type === 'visit' ? "Ej. Depto 502" : "Ej. Entrega de paquete mediano"}
                                    placeholderTextColor={colors.subtext}
                                    value={purpose}
                                    onChangeText={setPurpose}
                                />
                            </View>

                            <TouchableOpacity onPress={handleSubmit} style={[styles.submitButton, { backgroundColor: colors.accent }]}>
                                <Text style={styles.submitText}>Registrar Entrada</Text>
                                <Ionicons name="arrow-forward-circle" size={24} color="white" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>

                        </BlurView>

                        {/* Espacio extra para asegurar scroll */}
                        <View style={{ height: 100 }} />

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 20,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
        marginBottom: 24,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    descText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    formContainer: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        overflow: 'hidden',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cameraBox: {
        height: 180,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        overflow: 'hidden',
    },
    cameraText: {
        marginTop: 12,
        fontSize: 14,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    checkBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    submitButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default RegistrationScreen;
