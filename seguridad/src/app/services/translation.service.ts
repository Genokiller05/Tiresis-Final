import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations = {
    'Español': {
      // Text for home component
      home: {
        pageTitle: 'Administracion de guardias',
        searchLabel: 'Buscar guardia (ID de empleado)',
        searchPlaceholder: 'Ingresa ID de empleado (8 dígitos)',
        searchButton: 'Buscar',
        clearButton: 'Limpiar',
        guardDetailsTitle: 'Detalles del Guardia',
        statusLabel: 'Estado',
        emailLabel: 'Email',
        employeeIdLabel: 'ID de empleado',
        areaLabel: 'Área asignada',
        deleteButton: 'Eliminar',
        photoTitle: 'Foto',
        actionsTitle: 'Últimas acciones',
        noActivities: 'No hay actividades recientes.',
        initialMessage: 'Busca un ID de empleado para ver la información del guardia.',
        logoutButton: 'Cerrar sesión',
        logoutModalTitle: '¿Está seguro de cerrar su sesión?',
        deleteModalTitle: '¿Está seguro de eliminar al guardia',
        deleteModalWarning: 'Esta acción no se puede deshacer.',
        confirmDeleteButton: 'SI, ELIMINAR',
        cancelButton: 'NO, CANCELAR',
        yesButton: 'SI',
        noButton: 'NO'
      },
      // Text for admin-profile component
      adminProfile: {
        pageTitle: 'Perfil y Configuración',
        editProfile: 'Editar Perfil',
        saveChanges: 'Guardar Cambios',
        personalInfoTitle: 'Información Personal',
        personalInfoSubtitle: 'Datos personales y de contacto del administrador.',
        emailLabel: 'Dirección de Email',
        phoneLabel: 'Número de Teléfono',
        lastLoginLabel: 'Último Inicio de Sesión',
        securityTitle: 'Configuración de Seguridad',
        securitySubtitle: 'Gestiona tu contraseña.',
        passwordLabel: 'Contraseña',
        lastChangedLabel: 'Último cambio: Hace 2 meses',
        changePasswordBtn: 'Cambiar Contraseña',
        newPasswordLabel: 'Nueva Contraseña',
        confirmPasswordLabel: 'Confirmar Contraseña',
        acceptBtn: 'Aceptar',
        cancelBtn: 'Cancelar',
        prefsTitle: 'Preferencias',
        prefsSubtitle: 'Personaliza la experiencia de la aplicación.',
        languageLabel: 'Idioma',
        themeLabel: 'Tema'
      },
      // Text for login component
      login: {
        pageTitle: 'Sistema de Vigilancia',
        pageSubtitle: 'Acceso de Personal Autorizado',
        emailLabel: 'Correo Electrónico',
        emailPlaceholder: 'usuario@seguro.mx',
        passwordLabel: 'Contraseña',
        passwordPlaceholder: '••••••••',
        loginButton: 'Ingresar',
        copyright: '© 2025 Corporativo de Seguridad. Todos los derechos reservados.',
        deniedMessage: 'Acceso Denegado',
        lockedMessage: 'Demasiados intentos fallidos. Intente de nuevo en 60 segundos.',
        lockedTimeRemaining: 'Tiempo restante: '
      },
      alertas: {
        pageTitle: 'Alertas y Reportes',
        pageSubtitle: 'Gestione y analice las incidencias de seguridad.',
        filtersTitle: 'Filtros de Búsqueda',
        clearFiltersButton: 'Limpiar Filtros',
        fromLabel: 'Desde',
        toLabel: 'Hasta',
        originLabel: 'Origen',
        alertTypeLabel: 'Tipo de alerta',
        allOption: 'Todos',
        originOptions: ['IA', 'Guardia'],
        alertTypeOptions: ['Incidente', 'Novedad', 'Rondín', 'Alerta recibida', 'Mantenimiento', 'Sospechoso', 'Emergencia'],
        tableHeaderDate: 'Fecha y hora',
        tableHeaderOrigin: 'Origen',
        tableHeaderAlertType: 'Tipo de alerta',
        tableHeaderSite: 'Sitio/Area',
        tableHeaderStatus: 'Estado',
        tableHeaderActions: 'Acciones',
        noRecordsMessage: 'No se encontraron registros con los filtros aplicados.',
        modifyStatusAction: 'Modificar Estado',
        deleteAction: 'Eliminar',
        modifyStatusModalTitle: 'Modificar Estado de Alerta',
        alertLabel: 'Alerta',
        dateLabel: 'Fecha',
        newStatusLabel: 'Nuevo Estado',
        cancelButton: 'Cancelar',
        confirmButton: 'Confirmar',
        deleteModalTitle: '¿Está seguro de eliminar esta alerta?',
        deleteModalWarning: 'Esta acción no se puede deshacer.',
        confirmDeleteButton: 'SI, ELIMINAR',
        logoutModalTitle: '¿Está seguro de cerrar su sesión?',
        yesButton: 'SI',
        noButton: 'NO'
      },
      registros: {
        pageTitle: 'Registrar Nuevo Guardia',
        pageSubtitle: 'Complete el formulario para añadir un nuevo miembro al equipo.',
        uploadImageLabel: 'Subir imagen',
        fullNameLabel: 'Nombre Completo',
        fullNamePlaceholder: 'Nombre completo del guardia',
        emailLabel: 'Correo Electrónico',
        emailPlaceholder: 'usuario@segcdmx.mx',
        areaLabel: 'Área Asignada',
        areaPlaceholder: 'Selecciona un área...',
        guardIdLabel: 'ID de Guardia',
        regenerateButton: 'Regenerar',
        registerButton: 'Registrar Guardia',
        imageError: 'Debe seleccionar una imagen.',
        nameError: 'El nombre no puede estar vacío.',
        emailError: 'El correo debe ser corporativo (@segcdmx.mx).',
        areaError: 'Debe seleccionar un área.'
      }
    },
    'English': {
      home: {
        pageTitle: 'Guard Management',
        searchLabel: 'Search guard (Employee ID)',
        searchPlaceholder: 'Enter employee ID (8 digits)',
        searchButton: 'Search',
        clearButton: 'Clear',
        guardDetailsTitle: 'Guard Details',
        statusLabel: 'Status',
        emailLabel: 'Email',
        employeeIdLabel: 'Employee ID',
        areaLabel: 'Assigned Area',
        deleteButton: 'Delete',
        photoTitle: 'Photo',
        actionsTitle: 'Last Actions',
        noActivities: 'No recent activities.',
        initialMessage: 'Search for an employee ID to see guard information.',
        logoutButton: 'Logout',
        logoutModalTitle: 'Are you sure you want to log out?',
        deleteModalTitle: 'Are you sure you want to delete guard',
        deleteModalWarning: 'This action cannot be undone.',
        confirmDeleteButton: 'YES, DELETE',
        cancelButton: 'NO, CANCEL',
        yesButton: 'YES',
        noButton: 'NO'
      },
      adminProfile: {
        pageTitle: 'Profile & Settings',
        editProfile: 'Edit Profile',
        saveChanges: 'Save Changes',
        personalInfoTitle: 'Personal Information',
        personalInfoSubtitle: 'Administrator’s personal and contact details.',
        emailLabel: 'Email Address',
        phoneLabel: 'Phone Number',
        lastLoginLabel: 'Last Login',
        securityTitle: 'Security Settings',
        securitySubtitle: 'Manage your password.',
        passwordLabel: 'Password',
        lastChangedLabel: 'Last changed: 2 months ago',
        changePasswordBtn: 'Change Password',
        newPasswordLabel: 'New Password',
        confirmPasswordLabel: 'Confirm Password',
        acceptBtn: 'Accept',
        cancelBtn: 'Cancel',
        prefsTitle: 'Preferences',
        prefsSubtitle: 'Customize the application experience.',
        languageLabel: 'Language',
        themeLabel: 'Theme'
      },
      login: {
        pageTitle: 'Surveillance System',
        pageSubtitle: 'Authorized Personnel Access',
        emailLabel: 'Email Address',
        emailPlaceholder: 'user@secure.com',
        passwordLabel: 'Password',
        passwordPlaceholder: '••••••••',
        loginButton: 'Login',
        copyright: '© 2025 Security Corp. All rights reserved.',
        deniedMessage: 'Access Denied',
        lockedMessage: 'Too many failed attempts. Try again in 60 seconds.',
        lockedTimeRemaining: 'Time remaining: '
      },
      alertas: {
        pageTitle: 'Alerts & Reports',
        pageSubtitle: 'Manage and analyze security incidents.',
        filtersTitle: 'Search Filters',
        clearFiltersButton: 'Clear Filters',
        fromLabel: 'From',
        toLabel: 'To',
        originLabel: 'Origin',
        alertTypeLabel: 'Alert Type',
        allOption: 'All',
        originOptions: ['AI', 'Guard'],
        alertTypeOptions: ['Incident', 'Novelty', 'Patrol', 'Received alert', 'Maintenance', 'Suspicious', 'Emergency'],
        tableHeaderDate: 'Date and time',
        tableHeaderOrigin: 'Origin',
        tableHeaderAlertType: 'Alert Type',
        tableHeaderSite: 'Site/Area',
        tableHeaderStatus: 'Status',
        tableHeaderActions: 'Actions',
        noRecordsMessage: 'No records found with the applied filters.',
        modifyStatusAction: 'Modify Status',
        deleteAction: 'Delete',
        modifyStatusModalTitle: 'Modify Alert Status',
        alertLabel: 'Alert',
        dateLabel: 'Date',
        newStatusLabel: 'New Status',
        cancelButton: 'Cancel',
        confirmButton: 'Confirm',
        deleteModalTitle: 'Are you sure you want to delete this alert?',
        deleteModalWarning: 'This action cannot be undone.',
        confirmDeleteButton: 'YES, DELETE',
        logoutModalTitle: 'Are you sure you want to log out?',
        yesButton: 'YES',
        noButton: 'NO'
      },
      registros: {
        pageTitle: 'Register New Guard',
        pageSubtitle: 'Complete the form to add a new team member.',
        uploadImageLabel: 'Upload image',
        fullNameLabel: 'Full Name',
        fullNamePlaceholder: 'Full name of the guard',
        emailLabel: 'Email Address',
        emailPlaceholder: 'user@securecorp.mx',
        areaLabel: 'Assigned Area',
        areaPlaceholder: 'Select an area...',
        guardIdLabel: 'Guard ID',
        regenerateButton: 'Regenerate',
        registerButton: 'Register Guard',
        imageError: 'An image must be selected.',
        nameError: 'Name cannot be empty.',
        emailError: 'Email must be a corporate email (@securecorp.mx).',
        areaError: 'An area must be selected.'
      }
    }
  };

  public currentLanguage: BehaviorSubject<string>;
  public uiText: BehaviorSubject<any> = new BehaviorSubject<any>({});

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    let savedLang = 'Español';
    if (isPlatformBrowser(this.platformId)) {
      savedLang = localStorage.getItem('language') || 'Español';
    }
    this.currentLanguage = new BehaviorSubject<string>(savedLang);
    this.uiText.next(this.translations[savedLang as keyof typeof this.translations]);

    this.currentLanguage.subscribe(lang => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('language', lang);
      }
      this.uiText.next(this.translations[lang as keyof typeof this.translations]);
    });
  }

  public setLanguage(lang: string) {
    this.currentLanguage.next(lang);
  }
}
