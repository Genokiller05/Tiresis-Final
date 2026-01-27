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
  id: string; // text
  fechaHora: string; // timestamptz (quoted as "fechaHora" in DB)
  origen: string; // text
  tipo: string; // text
  sitioArea: string; // text (quoted as "sitioArea" in DB)
  estado: string; // text
  detalles: any; // jsonb
  created_at?: string; // timestamptz
}

export type ReportInsert = Omit<Report, 'id' | 'created_at'>;


