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
 */
export interface Report {
  id: string; // text
  fechaHora: string; // timestamptz
  origen: string; // text
  tipo: string; // text
  sitioArea: string; // text
  estado: string; // text
  detalles: any; // jsonb
  created_at?: string; // timestamptz
}

export type ReportInsert = Report;

