import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Subject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReportService {

    private reportUpdates = new Subject<any>();

    constructor(private supabaseService: SupabaseService) {
        this.setupRealtimeSubscription();
    }

    private setupRealtimeSubscription() {
        this.supabaseService.client
            .channel('reports-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reports' },
                (payload) => {
                    console.log('Realtime change received!', payload);
                    this.reportUpdates.next(payload);
                }
            )
            .subscribe((status, err) => {
                if (err) console.error('Supabase Realtime subscription error:', err);
                else console.log('Supabase Realtime subscription status:', status);
            });
    }

    getReportUpdates(): Observable<any> {
        return this.reportUpdates.asObservable();
    }

    async getReports(): Promise<any[]> {
        const { data, error } = await this.supabaseService.client
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
        return data || [];
    }

    async createReport(report: any): Promise<any> {
        const { data, error } = await this.supabaseService.client
            .from('reports')
            .insert(report)
            .select()
            .single();

        if (error) {
            console.error('Error creating report:', error);
            throw error;
        }
        return data;
    }

    async updateReport(id: string, updates: any): Promise<any> {
        const { data, error } = await this.supabaseService.client
            .from('reports')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating report:', error);
            throw error;
        }
        return data;
    }

    async deleteReport(id: string): Promise<any> {
        const { data, error } = await this.supabaseService.client
            .from('reports')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error deleting report:', error);
            throw error;
        }
        return data;
    }
}
