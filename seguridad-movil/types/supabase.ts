// src/types/supabase.ts

/**
 * Interface for the 'sites' table.
 */
// src/types/supabase.ts

/**
 * Interface for the 'buildings' table (formerly sites).
 */
export interface Site {
  id: string; // text
  name: string;
  geometry?: any; // jsonb
  created_at?: string; // timestamptz
}

/**
 * Interface for the 'reports' table.
 * Column names match the SQL schema with quoted identifiers.
 */
export interface Report {
  id: string; // uuid
  site_id?: string;
  shift_id?: string;
  report_type_id?: number;
  status_id?: number;
  priority_id?: number;
  location_id?: string;
  gps_lat?: number;
  gps_lng?: number;
  short_description?: string;
  created_at?: string; // timestamptz
  closed_at?: string;
  created_by_guard_id?: string; // uuid
  detalles?: any; // dynamic metadata like guard name/id
  // These are often joined in queries, but for raw insert/select they aren't there
  // We might want to add optional joined fields for display if we use a view or join
  report_type?: { name: string };
  report_status?: { name: string };
}

export type ReportInsert = Omit<Report, 'id' | 'created_at' | 'report_type' | 'report_status'>;



export interface Guard {
  id?: string; // UUID
  idEmpleado: string; // "00012345"
  nombre: string;     // "Juan Pérez López"
  full_name?: string; // Alias usado por el backend
  document_id?: string; // Alias de idEmpleado
  email: string;
  area?: string;      // "Entrada principal – Edificio A"
  foto?: string;
  photo_url?: string; // Alias usado por algunos endpoints
  estado?: string;
  telefono?: string;
  phone?: string;     // Alias
  direccion?: string;
  created_at?: string;
  fechaContratacion?: string;
  actividades?: any[];
  site_id?: string;
  is_active?: boolean;
}

export type NotificationType = 'area_change' | 'shift_start' | 'shift_end' | 'general';

export interface GuardNotification {
  id: string;
  guard_id: string;
  title: string;
  body: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}
