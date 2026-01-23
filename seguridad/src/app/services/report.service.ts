import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private apiUrl = 'http://localhost:3000/api/reports';

    constructor(private http: HttpClient) { }

    async getReports(): Promise<any[]> {
        return firstValueFrom(this.http.get<any[]>(this.apiUrl));
    }

    async createReport(report: any): Promise<any> {
        return firstValueFrom(this.http.post<any>(this.apiUrl, report));
    }

    async updateReport(id: string, updates: any): Promise<any> {
        return firstValueFrom(this.http.patch<any>(`${this.apiUrl}/${id}`, updates));
    }

    async deleteReport(id: string): Promise<any> {
        return firstValueFrom(this.http.delete<any>(`${this.apiUrl}/${id}`));
    }
}
