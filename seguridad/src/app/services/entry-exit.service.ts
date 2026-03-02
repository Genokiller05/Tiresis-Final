import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Subject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class EntryExitService {

    private entriesUpdates = new Subject<any>();

    constructor(private supabaseService: SupabaseService) {
        this.setupRealtimeSubscription();
    }

    private setupRealtimeSubscription() {
        this.supabaseService.client
            .channel('entries-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'entries_exits' },
                (payload) => {
                    console.log('Realtime change received (Entries)!', payload);
                    this.entriesUpdates.next(payload);
                }
            )
            .subscribe((status, err) => {
                if (err) console.error('Supabase Realtime subscription error (Entries):', err);
                else console.log('Supabase Realtime subscription status (Entries):', status);
            });
    }

    getEntriesUpdates(): Observable<any> {
        return this.entriesUpdates.asObservable();
    }

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
