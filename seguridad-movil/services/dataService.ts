// src/services/dataService.ts
import { supabase } from '../lib/supabase';
import type { Site, Report, ReportInsert } from '../types/supabase';

// Re-export types for convenience
export type { Report };

/**
 * Fetches all sites (buildings) from the database.
 * 
 * @returns A promise that resolves to an array of sites.
 */
export const fetchSites = async (): Promise<Site[]> => {
  const { data, error } = await supabase
    .from('buildings') // Fetch from 'buildings' table
    .select('*');

  if (error) {
    console.error('Error fetching sites:', error);
    throw new Error(error.message);
  }

  // Map fields if necessary, but 'id' and 'name' should match
  return data || [];
};

/**
 * Creates a new report in the database.
 * 
 * @param reportData - The data for the new report.
 * @returns A promise that resolves to the newly created report.
 */
export const createReport = async (reportData: ReportInsert): Promise<Report> => {
  const { data, error } = await supabase
    .from('reports')
    .insert([reportData])
    .select()
    .single();

  if (error) {
    console.error('Error creating report:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Updates the status of a guard.
 * 
 * @param idEmpleado - The ID of the guard.
 * @param status - The new status (e.g., 'En servicio', 'Fuera de servicio').
 */
export const updateGuardStatus = async (idEmpleado: string, status: string): Promise<any> => {
  const { data, error } = await supabase
    .from('guards')
    .update({ estado: status })
    .eq('idEmpleado', idEmpleado)
    .select()
    .single();

  if (error) {
    console.error('Error updating guard status:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Fetches all reports from the database.
 * 
 * @returns A promise that resolves to an array of reports.
 */
export const getAllReports = async (): Promise<Report[]> => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('fechaHora', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    throw new Error(error.message);
  }

  return data || [];
};

