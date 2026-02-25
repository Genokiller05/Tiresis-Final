import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  ImageBackground,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from './theme/ThemeContext';
import { useI18n } from './theme/I18nContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { supabase } from './lib/supabase';
import { useUser } from './context/UserContext';

type RootStackParamList = {
  LoginScreen: undefined;
  MainTabs: { screen?: 'Home' | 'GuardCameras' | 'AlertsDashboard' | 'Reports' };
};

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'LoginScreen'
>;

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { isDarkMode, colors } = useTheme();
  const { t } = useI18n();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    if (!email) {
      Alert.alert(t('login.error_title'), t('login.enter_email'));
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('guards')
        .select('*')
        .eq('email', email.trim().toLowerCase()) // Normalize email
        .single();

      if (error || !data) {
        setIsLoading(false);
        Alert.alert(t('login.access_error'), t('login.email_not_found'));
        return;
      }

      // Success
      console.log("Login data:", data);

      // Temporary fix: If data does not have 'id' but has 'idEmpleado', maybe we can use that?
      // Or maybe the 'guards' table uses a different PK.
      // We will cast it for now, but the NewReportScreen check will catch if it's missing.
      login(data as any); // Cast to Guard if needed, or better, type the select
      setIsLoading(false);
      // Optional: Store user session here if needed
      navigation.replace('MainTabs', { screen: 'Home' });

    } catch (err) {
      setIsLoading(false);
      Alert.alert(t('login.error_title'), t('login.generic_error'));
      console.error(err);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        {/* Dynamic Background - Professional Deep Blue with Gold Ambience */}
        <LinearGradient
          colors={isDarkMode ? ['#020617', '#0f172a', '#172554'] : ['#f0f9ff', '#e0f2fe', '#bae6fd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundGradient}
        >
          {/* Gold Ambient Glow (Top Right - Sun/Luxury effect) */}
          <View style={[styles.glowOrb, {
            top: -150,
            right: -100,
            width: 400,
            height: 400,
            backgroundColor: '#fbbf24', // Pure Gold
            opacity: 0.15
          }]} />

          {/* Deep Blue/Purple Ambient Glow (Bottom Left - Depth) */}
          <View style={[styles.glowOrb, {
            bottom: -150,
            left: -100,
            width: 500,
            height: 500,
            backgroundColor: '#1e3a8a',
            opacity: 0.4
          }]} />
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <SafeAreaView style={styles.contentContainer}>
            <Animated.View style={[styles.animContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

              {/* Header */}
              <View style={styles.header}>
                <Animated.View style={[
                  styles.logoContainer,
                  {
                    shadowColor: '#fbbf24', // Gold shadow
                    shadowOpacity: 0.8,
                    shadowRadius: 25,
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: 'transparent'
                  }
                ]}>
                  <Image
                    source={require('./assets/logo_tiresis.png')}
                    style={{ width: 140, height: 140, resizeMode: 'contain' }}
                  />
                </Animated.View>
                <Text style={[styles.title, { color: isDarkMode ? '#f8fafc' : '#1e293b' }]}>TIRESIS</Text>
                <Text style={[styles.subtitle, { color: '#fbbf24', letterSpacing: 1.5, fontSize: 12, fontWeight: '600' }]}>{t('login.subtitle')}</Text>
              </View>

              {/* Glassmorphism Card with Subtle Gold Border */}
              <View style={[styles.glassCardContainer, {
                borderColor: isDarkMode ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255,255,255,0.4)', // Gold subtle border
                borderWidth: 1,
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.7)'
              }]}>
                <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint={isDarkMode ? 'dark' : 'light'} style={styles.blurContainer}>

                  {/* Inputs */}
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.label, { color: isDarkMode ? '#cbd5e1' : '#475569' }]}>{t('login.email_label')}</Text>
                    <View style={[
                      styles.inputContainer,
                      {
                        borderColor: isEmailFocused ? colors.accent : (isDarkMode ? '#334155' : '#cbd5e1'),
                        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                        shadowOpacity: isEmailFocused ? 0.2 : 0,
                        shadowColor: colors.accent
                      }
                    ]}>
                      <Ionicons name="mail-outline" size={20} color={isEmailFocused ? colors.accent : '#94a3b8'} style={{ marginRight: 10 }} />
                      <TextInput
                        style={[styles.input, { color: isDarkMode ? '#fff' : '#0f172a' }]}
                        placeholder={t('login.email_placeholder')}
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                      />
                    </View>
                  </View>

                  {/* Main Action Action */}
                  <TouchableOpacity
                    onPress={handleLogin}
                    disabled={isLoading}
                    style={[styles.loginButton, { shadowColor: colors.accent, marginTop: 10 }]}
                  >
                    <LinearGradient
                      colors={[colors.accent, '#3b82f6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      {isLoading ? (
                        <View />
                      ) : (
                        <Text style={styles.loginButtonText}>{t('login.button')}</Text>
                      )}

                    </LinearGradient>
                  </TouchableOpacity>

                </BlurView>
              </View>

              <View style={styles.footer}>
                <Text style={{ color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 12 }}>Version 2.1.0 • Access Control</Text>
              </View>

            </Animated.View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    filter: 'blur(50px)', // Web support
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  animContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 150,
    height: 150,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  glassCardContainer: {
    width: '100%',
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 5,
  },
  blurContainer: {
    padding: 30,
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  forgotPassword: {
    display: 'none', // Hidden
  },
  loginButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientButton: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
});

export default LoginScreen;