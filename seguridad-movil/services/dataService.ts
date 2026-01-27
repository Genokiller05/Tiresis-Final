import { supabase } from '../lib/supabaseClient';
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
    .order('fechaHora', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Uploads an evidence image to Supabase Storage.
 * 
 * @param uri - The local URI of the image.
 * @returns The public URL of the uploaded image.
 */
export const uploadEntryEvidence = async (uri: string): Promise<string | null> => {
  try {
    const filename = `evidence/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

    // Create a FormData object to upload the file
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: 'evidence.jpg',
      type: 'image/jpeg',
    } as any);

    const { data, error } = await supabase.storage
      .from('evidence') // Ensure this bucket exists in Supabase
      .upload(filename, formData, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading evidence:', error);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from('evidence')
      .getPublicUrl(filename);

    return publicData.publicUrl;
  } catch (error) {
    console.error('Upload exception:', error);
    return null;
  }
};
