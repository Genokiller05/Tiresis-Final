// src/services/dataService.ts
import { supabase } from '../lib/supabase';
import type { Site, Report, ReportInsert } from '../types/supabase';

/**
 * Fetches all sites from the database.
 * 
 * @returns A promise that resolves to an array of sites.
 */
export const fetchSites = async (): Promise<Site[]> => {
  const { data, error } = await supabase
    .from('sites')
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
    .single(); // .single() is used to get a single object back instead of an array

  if (error) {
    console.error('Error creating report:', error);
    throw new Error(error.message);
  }

  return data;
};

// You can add more functions here to interact with other tables like:
// - fetchShifts()
// - getProfile(userId)
// - etc.