# Sistema de Vigilancia TIRESIS

Este proyecto es una plataforma integral de seguridad y vigilancia que consta de un panel administrativo web, una aplicación móvil para guardias y residentes, y un backend que gestiona la lógica de negocio y la sincronización de datos.

## 📁 Estructura del Proyecto

El sistema se divide en los siguientes componentes principales:

*   **`seguridad/`**: Contiene el código fuente del **Panel Web Administrativo** (desarrollado en Angular) y el **Backend** (Node.js/Express).
*   **`seguridad-movil/`**: Contiene el código fuente de la **Aplicación Móvil** (desarrollada en React Native con Expo).

---

## 🚀 Arquitectura y Tecnologías

### 1. Panel Web (Administrador)
*   **Framework**: Angular (v21+).
*   **Estilos**: TailwindCSS.
*   **Mapas**: Leaflet para visualización de ubicaciones de guardias y edificios.
*   **Funcionalidades**:
    *   Gestión de usuarios (Administradores y Guardias).
    *   Monitoreo de cámaras de seguridad.
    *   Visualización de reportes de incidentes.
    *   Registro de edificios y bitácora de entradas/salidas.
    *   Integración con Stripe (OXXO) para gestión de pagos/suscripciones.

### 2. Aplicación Móvil (Guardias/Residentes)
*   **Framework**: React Native (Expo).
*   **Funcionalidades**:
    *   Inicio de sesión seguro.
    *   **Registro de Visitantes**: Control de entradas y salidas con escaneo (futuro) y formularios manuales.
    *   **Reporte de Incidentes**: Envío de reportes con descripción y evidencia fotográfica (usando la cámara del dispositivo).
    *   **Botón de Pánico**: Acceso rápido a alertas.
    *   Soporte multilingüe (Español/Inglés).

### 3. Backend y Base de Datos
*   **Servidor**: Node.js con Express (`seguridad/server.js`).
*   **Base de Datos Principal**: **Supabase** (PostgreSQL).
*   **Persistencia Local**: Sistema de respaldo en archivos JSON (`data/*.json`) para funcionamiento offline o híbrido.
*   **Almacenamiento de Archivos**:
    *   Local: Carpeta `uploads/` para imágenes subidas.
    *   Nube: Integración con Supabase Storage (en proceso).

---

## ⚙️ Configuración e Instalación

### Prerrequisitos
*   Node.js (versión LTS recomendada, v18+).
*   NPM (gestor de paquetes).
*   Dispositivo móvil con Expo Go (para probar la app) o emulador Android/iOS.

### Paso 1: Configuración del Backend y Panel Web
El backend reside dentro de la carpeta del proyecto web.

1.  Navega a la carpeta `seguridad`:
    ```bash
    cd seguridad
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```

### Paso 2: Configuración de la App Móvil

1.  Navega a la carpeta `seguridad-movil`:
    ```bash
    cd seguridad-movil
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```

---

## ▶️ Ejecución del Proyecto

Para que el sistema funcione correctamente, debes ejecutar los servicios en el siguiente orden:

### 1. Iniciar el Backend (API)
Este servicio debe estar corriendo para que la web y la app puedan consultar y guardar datos.

*   **Comando**:
    ```bash
    cd seguridad
    npm run start:server
    ```
*   **Puerto**: El servidor escuchará en `http://localhost:3000`.

### 2. Iniciar el Panel Web
*   **Comando**:
    ```bash
    cd seguridad
    npm start
    ```
*   **Acceso**: Abre tu navegador en `http://localhost:4200`.

### 3. Iniciar la App Móvil
*   **Comando**:
    ```bash
    cd seguridad-movil
    npx expo start
    ```
*   **Uso**:
    *   Escanea el código QR con la app **Expo Go** en tu celular (Android/iOS).
    *   O presiona `a` para abrir en emulador Android, `i` para simulador iOS, o `w` para web.

---

## 🔑 Cuentas y Accesos

### Administrador (Web)
*   Se puede registrar una nueva cuenta desde la pantalla de Login -> "Registrarse".
*   Si falla la conexión a Supabase, el sistema usará credenciales almacenadas localmente en `seguridad/data/admins.json`.

### Guardias (Móvil)
*   Los guardias deben ser registrados previamente por un Administrador desde el Panel Web.
*   **Credenciales**: Usan su `email` y contraseña asignada (o `idEmpleado` según configuración).

---

## 🛠️ Flujos de Trabajo Principales

### A. Gestión de Guardias
1.  **Admin** accede al panel web -> sección "Guardias".
2.  Registra un nuevo guardia (Nombre, ID, Foto, Email).
3.  El sistema guarda en Supabase (tabla `guards`) y localmente.
4.  **Guardia** descarga la app e inicia sesión con sus credenciales.

### B. Reporte de Incidentes
1.  **Guardia** detecta una anomalía.
2.  Abre la app móvil -> "Reportar Incidente".
3.  Selecciona tipo, añade descripción y toma una foto.
4.  Al enviar, la app manda los datos a la API (`POST /api/reports`).
5.  El backend guarda el reporte en Supabase y la foto en `seguridad/data/uploads`.
6.  **Admin** ve el nuevo reporte en su Dashboard Web en tiempo real (al recargar).

### C. Bitácora de Accesos
1.  **Guardia** registra una "Nueva Visita" en la app.
2.  Ingresa datos del visitante y motivo.
3.  Los datos se sincronizan con la tabla `entries_exits`.
4.  El sistema permite auditar quién entra y sale de las instalaciones.

---

## ⚠️ Notas Importantes
*   **Supabase**: Las claves de configuración (`supabaseUrl`, `supabaseKey`) se encuentran actualmente en `seguridad/server.js`. Para producción, se recomienda moverlas a variables de entorno (`.env`).
*   **Stripe**: El modo de pruebas está habilitado para pagos OXXO simulados.
*   **Sincronización**: El backend intenta escribir primero en Supabase; si falla, usa archivos JSON locales como respaldo.
