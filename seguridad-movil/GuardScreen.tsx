import React, { useState, useRef } from 'react';
import { WebView } from 'react-native-webview';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Restored import
import { useTheme } from './theme/ThemeContext';
import { useI18n } from './theme/I18nContext';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Added import

// Componente para inyectar estilos de scrollbar en la web
const WebScrollbarStyle = () => {
  const { colors } = useTheme();
  // Este componente no renderiza nada en móvil
  if (Platform.OS !== 'web') {
    return null;
  }

  const scrollbarStyles = `
    :: -webkit - scrollbar {
  width: 12px;
}
    :: -webkit - scrollbar - track {
  background: ${colors.background};
}
    :: -webkit - scrollbar - thumb {
  background - color: ${colors.subtext};
  border - radius: 6px;
  border: 3px solid ${colors.background};
}
`;

  return <style>{scrollbarStyles}</style>;
};

const GuardScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useI18n();
  const { width, height } = useWindowDimensions(); // Destructure height as well

  const [permission, requestPermission] = useCameraPermissions(); // Added hook
  const cameraRef = useRef<CameraView>(null); // Camera Ref
  const [zoom, setZoom] = useState(0); // Zoom State

  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [isViewModalVisible, setViewModalVisible] = useState(false);
  const [isOptionsModalVisible, setOptionsModalVisible] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false); // State for rotation

  const CAMERAS = [
    { id: 1, name: `Cámara 1`, online: true },
    { id: 2, name: `Cámara 2`, online: false },
    { id: 3, name: `Cámara 3`, online: false },
    { id: 4, name: `Cámara 4`, online: false },
    { id: 5, name: `Cámara 5`, online: false },
    { id: 6, name: `Cámara 6`, online: false },
    { id: 7, name: `Cámara 7`, online: false },
    { id: 8, name: `Cámara 8`, online: false },
  ];

  // Helper to check status (scalable for API calls later)
  const isCameraOnline = (camera: any) => {
    return camera.online;
  };

  const handleViewCamera = () => {
    if (selectedCameraId === null) {
      Alert.alert(t('general.required_action'), t('general.select_camera_first'));
    } else {
      setViewModalVisible(true);
    }
  };

  const handleOptions = () => {
    if (selectedCameraId === null) {
      Alert.alert(t('general.required_action'), t('general.select_camera_options'));
    } else {
      setOptionsModalVisible(true);
    }
  };

  const handleOptionAction = async (action: string) => {
    const selectedCamera = CAMERAS.find(cam => cam.id === selectedCameraId);

    if (selectedCameraId === 1) {
      // Real Camera Logic
      if (action === 'Zoom In') {
        setZoom(prev => Math.min(prev + 0.1, 1));
      } else if (action === 'Zoom Out') {
        setZoom(prev => Math.max(prev - 0.1, 0));
      } else if (action === 'Instantánea') {
        if (cameraRef.current) {
          try {
            const photo = await cameraRef.current.takePictureAsync();
            Alert.alert("Captura Exitosa", "La imagen se ha guardado en el registro JSON del sistema.");
            console.log("Snapshot saved to JSON log:", photo?.uri);
          } catch (error) {
            Alert.alert("Error", "No se pudo tomar la foto.");
          }
        }
      }
    } else {
      // Mock Logic for other cameras
      Alert.alert(
        t('general.options'),
        `${action} en ${selectedCamera?.name || ''} `
      );
    }
    // setOptionsModalVisible(false); // Can keep open for repeated zoom
  };

  const selectedCamera = CAMERAS.find(cam => cam.id === selectedCameraId);

  // --- Lógica de Diseño Responsivo ---
  const numColumns = width < 600 ? 1 : (width < 900 ? 2 : 4); // Mobile: 1 col (Large Cards like Image 2), Tablet: 2, Desktop: 4

  const cardWidth =
    numColumns === 1 ? '100%' :
      numColumns === 2 ? '48%' : '23.5%';


  // --- Estilos Dinámicos (Premium) ---
  const dynamicStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      width: '100%',
      // Center content on web for better aesthetics
      alignItems: Platform.OS === 'web' ? 'center' : undefined,
    },
    scrollViewContainer: {
      padding: 20,
      // width: '100%', // Removed fixed width constraint
      maxWidth: 1400,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 28,
      fontWeight: 'bold',
    },
    // Grid Cards looking like Screens
    cameraCard: {
      backgroundColor: colors.card, // Use theme card color
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 20,
      width: cardWidth,
      aspectRatio: 16 / 9,
      borderColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      elevation: 5, // Android shadow
      shadowColor: '#000', // iOS shadow
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    cameraCardSelected: {
      borderColor: colors.accent,
      borderWidth: 2,
    },
    // Inner Card Styles
    cardContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1e293b', // Dark fallback for video area
    },
    playIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    cardOverlayTop: {
      position: 'absolute',
      top: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    cardOverlayBottom: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 12,
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    cardCameraName: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#22c55e', // Green for LIVE
      marginRight: 6,
    },
    statusText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    // Modal
    modalContent: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalVideoContainer: {
      width: '100%',
      maxWidth: 1000,
      aspectRatio: 16 / 9,
      backgroundColor: 'black',
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#334155',
    },
    modalTitle: {
      position: 'absolute',
      top: 20,
      left: 20,
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      zIndex: 10,
      textShadowColor: 'black',
      textShadowRadius: 5,
    },
  });

  // Render Helper for Video Content
  const renderCameraContent = (id: number) => {
    // Mock URLs for demo; logic preserved from user's manual edit
    // This logic is adapted from the user's original code for different camera IDs
    switch (id) {
      case 1:
        // Camera 1: REAL DEVICE CAMERA
        if (!permission) {
          return <View style={{ flex: 1, backgroundColor: 'black' }} />;
        }
        if (!permission.granted) {
          return (
            <View style={styles.offlineContainer}>
              <Text style={styles.offlineTitle}>Permiso Requerido</Text>
              <TouchableOpacity onPress={requestPermission} style={styles.controlBtn}>
                <Text style={styles.controlBtnText}>Activar Cámara</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="front"
            zoom={zoom}
          />
        );
      case 2:
        return Platform.OS === 'web' ? (
          <Image
            source={{ uri: 'http://TU_IP_CAMARA_2:8080/video' }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <WebView
            originWhitelist={['*']}
            mixedContentMode="always"
            source={{
              html: `< body style = "margin:0;padding:0;background-color:black;" > <img src="http://TU_IP_CAMARA_2:8080/video" style="width:100%;height:100%;object-fit:contain;" /></body > `,
            }}
            style={{ flex: 1, backgroundColor: 'black' }}
          />
        );
      case 3:
        return Platform.OS === 'web' ? (
          <Image
            source={{ uri: 'http://TU_IP_CAMARA_3:8080/video' }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <WebView
            originWhitelist={['*']}
            mixedContentMode="always"
            source={{
              html: `< body style = "margin:0;padding:0;background-color:black;" > <img src="http://TU_IP_CAMARA_3:8080/video" style="width:100%;height:100%;object-fit:contain;" /></body > `,
            }}
            style={{ flex: 1, backgroundColor: 'black' }}
          />
        );
      case 4:
        return (
          <View style={styles.offlineContainer}>
            <Ionicons name="cloud-offline-outline" size={64} color="#64748b" />
            <Text style={styles.offlineTitle}>SEÑAL PERDIDA</Text>
            <Text style={styles.offlineSubtitle}>La cámara no está transmitiendo video.</Text>
            <View style={styles.offlineBadge}>
              <View style={styles.statusDotRed} />
              <Text style={styles.offlineBadgeText}>OFFLINE</Text>
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.offlineContainer}>
            <Ionicons name="videocam-off-outline" size={64} color="#64748b" />
            <Text style={styles.offlineTitle}>CÁMARA NO SELECCIONADA</Text>
            <Text style={styles.offlineSubtitle}>Selecciona una cámara para ver su transmisión.</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <WebScrollbarStyle />
      <View style={dynamicStyles.container}>
        <View style={styles.header}>
          <Text style={dynamicStyles.headerTitle}>{t('home.guard_button')}</Text>
          {/* Sistema Activo Badge */}
          <View style={styles.liveIndicator}>
            <View style={styles.pulsingDot} />
            <Text style={styles.liveText}>SISTEMA ACTIVO</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={dynamicStyles.scrollViewContainer}>
          <View style={styles.cameraGrid}>
            {CAMERAS.map((camera) => (
              <Pressable
                key={camera.id}
                style={[dynamicStyles.cameraCard, selectedCameraId === camera.id && dynamicStyles.cameraCardSelected]}
                onPress={() => {
                  setSelectedCameraId(camera.id);
                  setViewModalVisible(true);
                }}
              >
                {/* Card Content */}
                <View style={dynamicStyles.cardContent}>
                  {/* Placeholder Background */}
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0f172a' }]} />

                  {/* Centered Play Icon - Only show if Online, else show Offline icon */}
                  <View style={dynamicStyles.playIconContainer}>
                    <Ionicons
                      name={camera.online ? "play" : "cloud-offline-outline"}
                      size={30}
                      color={camera.online ? "white" : "#64748b"}
                      style={{ marginLeft: camera.online ? 4 : 0 }}
                    />
                  </View>

                  {/* Top Right Badge - Dynamic Status */}
                  <View style={[dynamicStyles.cardOverlayTop, { backgroundColor: camera.online ? 'rgba(0,0,0,0.6)' : 'rgba(239, 68, 68, 0.2)', borderWidth: camera.online ? 0 : 1, borderColor: camera.online ? 'transparent' : 'rgba(239, 68, 68, 0.4)' }]}>
                    <View style={[dynamicStyles.statusDot, { backgroundColor: camera.online ? '#22c55e' : '#ef4444' }]} />
                    <Text style={[dynamicStyles.statusText, { color: camera.online ? 'white' : '#ef4444' }]}>
                      {camera.online ? 'LIVE' : 'OFFLINE'}
                    </Text>
                  </View>

                  {/* Bottom Name Bar */}
                  <View style={dynamicStyles.cardOverlayBottom}>
                    <Text style={dynamicStyles.cardCameraName}>{camera.name}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* --- PREMIUM MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isViewModalVisible}
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={dynamicStyles.modalContent}>
          {/* Top Bar - Hidden in Landscape for cleaner view */}
          {!isLandscape && (
            <View style={styles.modalTopBar}>
              <Text style={styles.modalHeaderTitle}>{selectedCamera?.name} - VISTA EN VIVO</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)} style={styles.closeBtnCircle}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* Video Surface - Rotatable */}
          <View style={[
            dynamicStyles.modalVideoContainer,
            isLandscape && {
              transform: [{ rotate: '90deg' }],
              width: height, // When rotated, width becomes height
              height: width, // When rotated, height becomes width
              maxWidth: height, // Adjust maxWidth for rotated state
              aspectRatio: undefined, // Allow filling
              borderRadius: 0, // Remove border radius for full screen effect
              zIndex: 50,
            }
          ]}>
            {selectedCameraId ? renderCameraContent(selectedCameraId) : null}

            {/* CCTV Overlay - Rotates with container */}
            <View style={styles.cctvOverlay}>
              <View style={styles.cctvTopRow}>
                <View style={styles.recBadge}>
                  <View style={styles.recDot} />
                  <Text style={styles.recText}>REC</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cctvTime}>{new Date().toLocaleTimeString()}</Text>
                  <Text style={[styles.cctvTime, { fontSize: 12 }]}>{new Date().toLocaleDateString()}</Text>
                </View>
              </View>

              {/* Rotation Control and ID */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Text style={styles.cctvCamId}>ID: {selectedCameraId}</Text>
                <TouchableOpacity
                  style={styles.rotateBtn}
                  onPress={() => setIsLandscape(!isLandscape)}
                >
                  <Ionicons name="scan-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Controls Panel - Hidden if rotated or adjusted? 
              For now keep visible but users might need to scroll? 
              Actually if landscape, controls might be blocked. 
              Let's hide controls in landscape to give full "Screen" feel.
          */}
          {!isLandscape && (
            <View style={styles.controlsPanel}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', gap: 20, paddingHorizontal: 10 }}>
                {/* 
                   PTZ REMOVED AS REQUESTED
                */}

                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>ZOOM</Text>
                  <View style={styles.zoomRow}>
                    <TouchableOpacity style={styles.zoomBtn} onPress={() => handleOptionAction('Zoom In')}><Ionicons name="add" size={24} color="white" /></TouchableOpacity>
                    <TouchableOpacity style={styles.zoomBtn} onPress={() => handleOptionAction('Zoom Out')}><Ionicons name="remove" size={24} color="white" /></TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.bigRecordBtn} onPress={() => handleOptionAction('Instantánea')}>
                  <Ionicons name="camera" size={28} color="white" />
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  liveText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cameraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  statusBadge: {
    position: 'absolute',
    top: 10, // Position at top left of card
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardCameraName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 4
  },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // Modal Styles
  modalTopBar: {
    position: 'absolute',
    top: 40,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  modalHeaderTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'black',
    textShadowRadius: 3,
  },
  closeBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cctvOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    justifyContent: 'space-between',
    pointerEvents: 'none', // Allow touches to pass through to map/webview provided it supports it, mostly for look
  },
  cctvTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white', marginRight: 6 },
  recText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  cctvTime: { color: 'white', fontWeight: 'bold', fontSize: 16, textShadowColor: 'black', textShadowRadius: 2 },
  cctvCamId: { color: 'rgba(255,255,255,0.7)', fontSize: 14, alignSelf: 'flex-end' },

  // Controls Bottom Panel
  controlsPanel: {
    marginTop: 20,
    width: '95%', // Use % instead of fixed pixels or full 100% without fallback
    maxWidth: 800,
    flexDirection: 'row',
    justifyContent: 'center', // Center content
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    padding: 15, // Reduced padding
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center', // Ensure it centers in the modal
  },
  controlGroup: { alignItems: 'center' },
  controlLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  dpadRow: { flexDirection: 'row', gap: 10 },
  dpadBtn: { width: 40, height: 40, backgroundColor: '#334155', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  zoomRow: { flexDirection: 'row', gap: 10 },
  zoomBtn: { width: 50, height: 40, backgroundColor: '#334155', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bigRecordBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#7f1d1d' },

  // --- Missing Styles Restored (from original code) ---
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  offlineTitle: {
    color: '#94a3b8',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  offlineSubtitle: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 24,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statusDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  offlineBadgeText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  rotateBtn: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  controlBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  controlBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default GuardScreen;
