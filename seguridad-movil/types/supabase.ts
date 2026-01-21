// src/types/supabase.ts

/**
 * Interface for the 'sites' table.
 */
export interface Site {
  id: string; // uuid
  name: string;
  address: string | null;
  is_active: boolean;
  created_at: string; // timestamptz
}

/**
 * Interface for the 'profiles' table.
 */
export interface Profile {
  id: string; // uuid
  full_name: string;
  document_id: string | null;
  phone: string | null;
  created_at: string; // timestamptz
}

/**
 * Interface for the 'shifts' table.
 */
export interface Shift {
  id: string; // uuid
  site_id: string; // uuid
  start_at: string; // timestamptz
  end_at: string; // timestamptz
  created_by: string; // uuid
  created_at: string; // timestamptz
}

/**
 * Interface for the 'reports' table.
 * This represents the data structure for creating a new report.
 */
export type ReportInsert = Omit<Report, 'id' | 'created_at' | 'closed_at'>;

/**
 * Interface for a record from the 'reports' table.
 */
export interface Report {
  id: string; // uuid
  site_id: string; // uuid
  shift_id: string | null;
  created_by_guard_id: string; // uuid
  report_type_id: number;
  status_id: number;
  priority_id: number;
  location_id: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  short_description: string;
  created_at: string; // timestamptz
  closed_at: string | null; // timestamptz
}
