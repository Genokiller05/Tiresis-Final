import { supabase } from '../lib/supabaseClient';
import type { Site, Report, ReportInsert } from '../types/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

// Re-export types for convenience
export type { Report };

/**
 * Fetches all sites (buildings) from the database.
 * 
 * @returns A promise that resolves to an array of sites.
 */
export const fetchSites = async (): Promise<Site[]> => {
  const { data, error } = await supabase
    .from('sites') // Fetch from 'sites' table
    .select('*');

  if (error || !data || data.length === 0) {
    if (error && (error.code === 'PGRST205' || error.message.includes('Could not find the table'))) {
      console.warn('Table sites/buildings not found, returning mock list.');
    } else if (error) {
      console.warn('Error fetching sites, using fallback:', error);
    }

    // Fallback Mock Data (Using valid UUIDs to match DB constraints)
    return [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Edificio Central' },
      { id: '22222222-2222-2222-2222-222222222222', name: 'Área Deportiva' },
      { id: '33333333-3333-3333-3333-333333333333', name: 'Entrada Principal' },
      { id: '44444444-4444-4444-4444-444444444444', name: 'Sitio General' }
    ];
  }

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
 * Fetches all reports from the database.
 * 
 * @returns A promise that resolves to an array of reports.
 */
export const fetchReports = async (): Promise<Report[]> => {
  // We need to join with related tables to get readable names
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const fetchReportTypes = async () => {
  const { data, error } = await supabase.from('report_types').select('*');
  if (error) throw error;
  return data;
};

export const fetchPriorities = async () => {
  const { data, error } = await supabase.from('priorities').select('*');
  if (error) throw error;
  return data;
};

export const fetchReportStatuses = async () => {
  const { data, error } = await supabase.from('report_statuses').select('*');
  if (error) throw error;
  return data;
};

/**
 * Creates a new entry/exit record in the database.
 * 
 * @param entryData - The data for the new entry/exit.
 * @returns A promise that resolves to the newly created record.
 */
export const createEntryExit = async (entryData: any): Promise<any> => {
  const { data, error } = await supabase
    .from('entries_exits')
    .insert([entryData])
    .select()
    .single();

  if (error) {
    console.error('Error creating entry/exit:', error);
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Uploads an evidence image to Supabase Storage and creates an evidence record.
 * 
 * @param uri - The local URI of the image.
 * @param userId - The ID of the user uploading the evidence.
 * @returns The ID of the newly created evidence record.
 */
export const uploadEntryEvidence = async (uri: string, userId: string): Promise<string | null> => {
  try {
    const filename = `evidence/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

    // Leer el archivo local a base64 usando expo-file-system
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('evidence') // Asegurarse que el bucket existe
      .upload(filename, decode(base64), {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading evidence:', uploadError);
      return null;
    }

    // Create an evidence record in the database
    const { data: evidenceData, error: evidenceError } = await supabase
      .from('evidences')
      .insert({
        evidence_type_id: 1, // Assuming 1 is for 'image'
        storage_path: filename,
        created_by_user_id: userId,
        mime_type: 'image/jpeg',
      })
      .select('id')
      .single();

    if (evidenceError) {
      console.error('Error creating evidence record:', evidenceError);
      return null;
    }

    return evidenceData.id;
  } catch (error) {
    console.error('Upload exception:', error);
    return null;
  }
};

/**
/**
 * Links an evidence record to a report.
 * 
 * @param reportId - The ID of the report.
 * @param evidenceId - The ID of the evidence.
 */
export const linkEvidenceToReport = async (reportId: string, evidenceId: string): Promise<void> => {
  const { error } = await supabase
    .from('report_evidences')
    .insert({
      report_id: reportId,
      evidence_id: evidenceId,
    });

  if (error) {
    console.error('Error linking evidence to report:', error);
  }
};

/**
 * Fetches a single report by ID from the database.
 * 
 * @param id - The ID of the report.
 * @returns A promise that resolves to the report.
 */
export const getReportById = async (id: string): Promise<Report | null> => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching report by id:', error);
    return null;
  }

  return data;
};
