import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class EntryExitService {

    constructor(private supabaseService: SupabaseService) { }

    async getEntriesExits(): Promise<any[]> {
        const { data, error } = await this.supabaseService.client
            .from('entries_exits')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching entries/exits:', error);
            throw error;
        }
        return data || [];
    }

    async createEntryExit(entry: any): Promise<any> {
        const { data, error } = await this.supabaseService.client
            .from('entries_exits')
            .insert(entry)
            .select()
            .single();

        if (error) {
            console.error('Error creating entry/exit:', error);
            throw error;
        }
        return data;
    }

    async updateEntryExit(id: string | number, updates: any): Promise<any> {
        const { data, error } = await this.supabaseService.client
            .from('entries_exits')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating entry/exit:', error);
            throw error;
        }
        return data;
    }

    async deleteEntryExit(id: string | number): Promise<any> {
        const { data, error } = await this.supabaseService.client
            .from('entries_exits')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error deleting entry/exit:', error);
            throw error;
        }
        return data;
    }
}
