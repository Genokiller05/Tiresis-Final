import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WeeklyReportIncident {
  id: string;
  created_at: string;
  status: string;
  status_label: string;
  type_label: string;
  area: string;
  description: string;
  guard_id: string | null;
  evidence_urls: string[];
}

export interface WeeklyReportSummary {
  total_reports?: number;
  status_counts?: Record<string, number>;
  hottest_area?: string;
  busiest_slot?: string;
  generated_at?: string;
  excluded_report_ids?: string[];
  included_reports?: WeeklyReportIncident[];
  source_reports?: WeeklyReportIncident[];
}

export interface WeeklyReport {
  id: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published';
  admin_notes?: string | null;
  site_id?: string | null;
  created_at: string;
  updated_at?: string;
  summary_json?: WeeklyReportSummary | null;
}

@Injectable({ providedIn: 'root' })
export class WeeklyReportService {
  private readonly apiUrl = environment.apiUrl;

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

  async generateReport(adminNotes?: string): Promise<{ message: string; report: WeeklyReport }> {
    try {
      return await firstValueFrom(
        this.http.post<{ message: string; report: WeeklyReport }>(`${this.apiUrl}/weekly-reports/generate`, {
          admin_notes: adminNotes ?? ''
        })
      );
    } catch (error) {
      throw this.buildApiError(error, 'No se pudo generar el informe semanal.');
    }
  }

  async publishReport(id: string, adminNotes?: string): Promise<{ message: string; report: WeeklyReport }> {
    try {
      return await firstValueFrom(
        this.http.patch<{ message: string; report: WeeklyReport }>(`${this.apiUrl}/weekly-reports/${id}/publish`, {
          admin_notes: adminNotes
        })
      );
    } catch (error) {
      throw this.buildApiError(error, 'No se pudo publicar el informe semanal.');
    }
  }

  async getReports(): Promise<WeeklyReport[]> {
    try {
      return await firstValueFrom(this.http.get<WeeklyReport[]>(`${this.apiUrl}/weekly-reports`));
    } catch (error) {
      throw this.buildApiError(error, 'No se pudieron cargar los informes semanales.');
    }
  }

  async getReport(id: string): Promise<WeeklyReport> {
    try {
      return await firstValueFrom(this.http.get<WeeklyReport>(`${this.apiUrl}/weekly-reports/${id}`));
    } catch (error) {
      throw this.buildApiError(error, 'No se pudo cargar el detalle del informe semanal.');
    }
  }

  async updateReport(
    id: string,
    payload: { admin_notes?: string; excluded_report_ids?: string[] }
  ): Promise<{ message: string; report: WeeklyReport }> {
    try {
      return await firstValueFrom(
        this.http.patch<{ message: string; report: WeeklyReport }>(
          `${this.apiUrl}/weekly-reports/${id}`,
          payload
        )
      );
    } catch (error) {
      throw this.buildApiError(error, 'No se pudo actualizar el informe semanal.');
    }
  }

  async deleteReport(id: string): Promise<{ message: string }> {
    try {
      return await firstValueFrom(this.http.delete<{ message: string }>(`${this.apiUrl}/weekly-reports/${id}`));
    } catch (error) {
      throw this.buildApiError(error, 'No se pudo eliminar el informe semanal.');
    }
  }
}
