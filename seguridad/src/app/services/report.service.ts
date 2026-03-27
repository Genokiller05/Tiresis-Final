import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private apiUrl = environment.apiUrl;
    private reportUpdates = new Subject<any>();

    constructor(private http: HttpClient, private supabaseService: SupabaseService) {
        console.error('[CRÍTICO-DEBUG] ReportService inicializado (V3-HEATMAP-FIX)');
        this.setupRealtimeSubscription();
    }

    private subscriptionAttempts = 0;
    private maxAttempts = 5;

    private setupRealtimeSubscription() {
        if (this.subscriptionAttempts >= this.maxAttempts) {
            console.warn('[REPORTS] Máximo de reintentos de suscripción alcanzado.');
            return;
        }

        const channel = this.supabaseService.client
            .channel('reports-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reports' },
                (payload) => {
                    // Solo loguear en depuración profunda
                    // console.debug('[REPORTS] Cambio en tiempo real recibido:', payload);
                    this.reportUpdates.next(payload);
                }
            )
            .subscribe((status, err) => {
                if (err || status === 'TIMED_OUT') {
                    // Silencio absoluto en consola a menos que sea error fatal
                    this.subscriptionAttempts++;
                    setTimeout(() => this.setupRealtimeSubscription(), 5000);
                } else {
                    if (status === 'SUBSCRIBED') {
                        this.subscriptionAttempts = 0; // Reset on success
                    }
                }
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
