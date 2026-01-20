// Tipos de datos
export interface Report {
  id: number;
  type: string;
  date: string;
  status: 'Enviado' | 'En Revisión' | 'Resuelto';
  summary: string;
  timestamp: string;
  evidence?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export interface Database {
  reports: Report[];
  users: User[];
}

// Base de datos en memoria (simulando el JSON)
let database: Database = {
  reports: [
    {
      id: 1,
      type: 'Intrusión detectada',
      date: '2025-11-24 10:30',
      status: 'Resuelto',
      summary: 'Acceso no autorizado en Almacén B, se notificó a seguridad.',
      timestamp: new Date().toISOString(),
    },
    {
      id: 2,
      type: 'Fallo de equipo',
      date: '2025-11-23 15:12',
      status: 'En Revisión',
      summary: 'La cámara CAM-04 del pasillo norte ha perdido la conexión.',
      timestamp: new Date().toISOString(),
    },
    {
      id: 3,
      type: 'Actividad sospechosa',
      date: '2025-11-23 08:45',
      status: 'Enviado',
      summary: 'Vehículo desconocido sin placas fue visto rondando el perímetro norte.',
      timestamp: new Date().toISOString(),
    },
    {
      id: 4,
      type: 'Vandalismo',
      date: '2025-11-22 23:50',
      status: 'Resuelto',
      summary: 'Graffiti encontrado en la pared exterior del Edificio C.',
      timestamp: new Date().toISOString(),
    },
  ],
  users: [
    {
      id: 1,
      name: 'Marlene García',
      email: 'marlene@example.com',
      role: 'Guard',
      avatar: '👤',
    },
  ],
};

// ============================================
// FUNCIONES PARA GESTIONAR REPORTES
// ============================================

/**
 * Obtiene todos los reportes
 */
export const getAllReports = (): Report[] => {
  return database.reports;
};

/**
 * Obtiene un reporte por ID
 */
export const getReportById = (id: number): Report | undefined => {
  return database.reports.find(report => report.id === id);
};

/**
 * Añade un nuevo reporte
 */
export const addReport = (report: Omit<Report, 'id' | 'timestamp'>): Report => {
  const newReport: Report = {
    ...report,
    id: Math.max(...database.reports.map(r => r.id), 0) + 1,
    timestamp: new Date().toISOString(),
  };
  database.reports.push(newReport);
  return newReport;
};

/**
 * Actualiza el estado de un reporte
 */
export const updateReportStatus = (
  id: number,
  status: 'Enviado' | 'En Revisión' | 'Resuelto'
): Report | undefined => {
  const report = database.reports.find(r => r.id === id);
  if (report) {
    report.status = status;
  }
  return report;
};

/**
 * Elimina un reporte por ID
 */
export const deleteReport = (id: number): boolean => {
  const index = database.reports.findIndex(r => r.id === id);
  if (index > -1) {
    database.reports.splice(index, 1);
    return true;
  }
  return false;
};

// ============================================
// FUNCIONES PARA GESTIONAR USUARIOS
// ============================================

/**
 * Obtiene todos los usuarios
 */
export const getAllUsers = (): User[] => {
  return database.users;
};

/**
 * Obtiene un usuario por ID
 */
export const getUserById = (id: number): User | undefined => {
  return database.users.find(user => user.id === id);
};

/**
 * Obtiene la base de datos completa
 */
export const getDatabase = (): Database => {
  return database;
};

/**
 * Restablece la base de datos a los valores iniciales (para pruebas)
 */
export const resetDatabase = (): void => {
  database = {
    reports: [
      {
        id: 1,
        type: 'Intrusión detectada',
        date: '2025-11-24 10:30',
        status: 'Resuelto',
        summary: 'Acceso no autorizado en Almacén B, se notificó a seguridad.',
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'Fallo de equipo',
        date: '2025-11-23 15:12',
        status: 'En Revisión',
        summary: 'La cámara CAM-04 del pasillo norte ha perdido la conexión.',
        timestamp: new Date().toISOString(),
      },
      {
        id: 3,
        type: 'Actividad sospechosa',
        date: '2025-11-23 08:45',
        status: 'Enviado',
        summary: 'Vehículo desconocido sin placas fue visto rondando el perímetro norte.',
        timestamp: new Date().toISOString(),
      },
      {
        id: 4,
        type: 'Vandalismo',
        date: '2025-11-22 23:50',
        status: 'Resuelto',
        summary: 'Graffiti encontrado en la pared exterior del Edificio C.',
        timestamp: new Date().toISOString(),
      },
    ],
    users: [
      {
        id: 1,
        name: 'Marlene García',
        email: 'marlene@example.com',
        role: 'Guard',
        avatar: '👤',
      },
    ],
  };
};
