import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private apiUrl = 'http://localhost:3000/api';
    private reportUpdates = new Subject<any>();

    constructor(private http: HttpClient, private supabaseService: SupabaseService) {
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
        return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/reports`));
    }

    async createReport(report: any): Promise<any> {
        return firstValueFrom(this.http.post<any>(`${this.apiUrl}/reports`, report));
    }

    async updateReport(id: string, updates: any): Promise<any> {
        return firstValueFrom(this.http.patch<any>(`${this.apiUrl}/reports/${id}`, updates));
    }

    async deleteReport(id: string): Promise<any> {
        return firstValueFrom(this.http.delete<any>(`${this.apiUrl}/reports/${id}`));
    }
}
