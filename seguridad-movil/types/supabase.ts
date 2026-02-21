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
  site_id: string; // uuid
  shift_id?: string; // uuid
  created_by_guard_id: string; // uuid
  report_type_id: number; // int
  status_id: number; // int
  priority_id: number; // int
  location_id?: string; // uuid
  gps_lat?: number; // numeric
  gps_lng?: number; // numeric
  short_description: string; // text
  created_at: string; // timestamptz
  closed_at?: string; // timestamptz
  // These are often joined in queries, but for raw insert/select they aren't there
  // We might want to add optional joined fields for display if we use a view or join
  report_type?: { name: string };
  report_status?: { name: string };
}

export type ReportInsert = Omit<Report, 'id' | 'created_at' | 'report_type' | 'report_status'>;



export interface Guard {
  id: string; // UUID
  idEmpleado: string; // "00012345"
  nombre: string;     // "Juan Pérez López"
  email: string;
  area?: string;      // "Entrada principal – Edificio A"
  foto?: string;
  estado?: string;
  created_at?: string;
  fechaContratacion?: string;
}
