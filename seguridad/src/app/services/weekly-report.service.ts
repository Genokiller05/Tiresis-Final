import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WeeklyReportService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private buildApiError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof HttpErrorResponse) {
      const responseBody = error.error;

      if (typeof responseBody === 'string' && responseBody.trim()) {
        return new Error(responseBody.trim());
      }

      const detailedMessage =
        responseBody?.error ||
        responseBody?.message ||
        error.message ||
        fallbackMessage;

      return new Error(detailedMessage);
    }

    if (error instanceof Error && error.message.trim()) {
      return error;
    }

    return new Error(fallbackMessage);
  }

  async generateReport(adminNotes?: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/weekly-reports/generate`, {
          admin_notes: adminNotes ?? ''
        })
      );
    } catch (error) {
      throw this.buildApiError(error, 'No se pudo generar el informe semanal.');
    }
  }

  async publishReport(id: string, adminNotes?: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.patch<any>(`${this.apiUrl}/weekly-reports/${id}/publish`, {
          admin_notes: adminNotes
        })
      );
    } catch (error) {
      throw this.buildApiError(error, 'No se pudo publicar el informe semanal.');
    }
  }

  async getReports(): Promise<any[]> {
    try {
      return await firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/weekly-reports`));
    } catch (error) {
      throw this.buildApiError(error, 'No se pudieron cargar los informes semanales.');
    }
  }
}
