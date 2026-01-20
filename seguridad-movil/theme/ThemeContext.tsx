
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define la estructura de nuestro tema para tener un tipado fuerte.
interface AppTheme {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: {
    background: string;
    card: string;
    text: string;
    subtext: string;
    accent: string;
    danger: string;
    border: string;
    inputBackground: string;
  };
}

// Define los colores específicos para el tema claro (Professional Calm).
const lightColors = {
  background: "#f8fafc", // Cool gray background
  card: "#ffffff",       // Pure white
  text: "#0f172a",       // Slate 900
  subtext: "#64748b",    // Slate 500
  accent: "#d97706",     // Amber 600 (Darker Gold for light mode)
  danger: "#ef4444",     // Red 500
  border: "#e2e8f0",     // Slate 200
  inputBackground: "#ffffff",
};

// Define los colores específicos para el tema oscuro (Blue & Gold - Royal Premium).
const darkColors = {
  background: "#0f172a", // Slate 900 (Deep Blue/Black base)
  card: "#172554",       // Blue 950 (Rich Blue for cards)
  text: "#f8fafc",       // Slate 50
  subtext: "#94a3b8",    // Slate 400
  accent: "#fbbf24",     // Amber 400 (Bright Gold)
  danger: "#f87171",     // Red 400
  border: "#1e3a8a",     // Blue 900 (Subtle blue border)
  inputBackground: "#1e293b", // Slate 800
};


// 1. Creación del Contexto
// Creamos el contexto con un valor inicial por defecto.
// Este valor se usará solo si un componente intenta usar el contexto
// sin estar envuelto en un ThemeProvider.
export const ThemeContext = createContext<AppTheme>({
  isDarkMode: false,
  toggleTheme: () => console.warn('ThemeProvider no encontrado'),
  colors: lightColors,
});

// Props que recibirá nuestro Provider.
type ThemeProviderProps = {
  children: ReactNode;
};

// 2. Creación del Provider
// Este componente envolverá nuestra aplicación (o partes de ella)
// y proveerá el estado del tema y las funciones para cambiarlo.
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Estado para saber si el modo oscuro está activado.
  // El valor inicial se carga de forma asíncrona desde AsyncStorage.
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 3. Persistencia con AsyncStorage y Carga Inicial
  // Usamos useEffect para cargar la preferencia del tema guardada
  // tan pronto como el componente se monte.
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme !== null) {
          // Si encontramos un tema guardado ('dark' o 'light'), lo aplicamos.
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // Si no hay nada guardado, usamos el tema del sistema operativo como valor inicial.
          const colorScheme = Appearance.getColorScheme();
          setIsDarkMode(colorScheme === 'dark');
        }
      } catch (error) {
        // En caso de error, usamos el tema del sistema como fallback.
        console.error("Error al cargar el tema desde AsyncStorage:", error);
        const colorScheme = Appearance.getColorScheme();
        setIsDarkMode(colorScheme === 'dark');
      }
    };

    loadTheme();
  }, []);

  // Función para cambiar el tema.
  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      // Cada vez que cambiamos el tema, guardamos la nueva preferencia.
      await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error("Error al guardar el tema en AsyncStorage:", error);
    }
  };

  // Seleccionamos el set de colores correcto basado en el estado isDarkMode.
  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? darkColors : lightColors,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// 4. Hook personalizado `useTheme`
// Este hook simplifica el uso del contexto en los componentes.
// En lugar de `useContext(ThemeContext)`, podemos simplemente usar `useTheme()`.
export const useTheme = () => useContext(ThemeContext);
