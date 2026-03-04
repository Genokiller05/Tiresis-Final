import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class EntryExitService {
    private apiUrl = 'http://localhost:3000/api';
    private entriesUpdates = new Subject<any>();

    constructor(private http: HttpClient, private supabaseService: SupabaseService) {
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
        return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/entries-exits`));
    }

    async createEntryExit(entry: any): Promise<any> {
        return firstValueFrom(this.http.post<any>(`${this.apiUrl}/entries-exits`, entry));
    }

    async updateEntryExit(id: string | number, updates: any): Promise<any> {
        return firstValueFrom(this.http.patch<any>(`${this.apiUrl}/entries-exits/${id}`, updates));
    }

    async deleteEntryExit(id: string | number): Promise<any> {
        return firstValueFrom(this.http.delete<any>(`${this.apiUrl}/entries-exits/${id}`));
    }
}
