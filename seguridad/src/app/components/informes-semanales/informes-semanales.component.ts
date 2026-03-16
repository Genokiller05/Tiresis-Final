import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  WeeklyReport,
  WeeklyReportIncident,
  WeeklyReportSummary,
  WeeklyReportService
} from '../../services/weekly-report.service';

@Component({
  selector: 'app-informes-semanales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informes-semanales.component.html',
  styleUrls: ['./informes-semanales.component.css']
})
export class InformesSemanalesComponent implements OnInit {
  public weekNumber = 0;
  public weekDateRange = '';
  public startDate = '';
  public endDate = '';

  public adminNotes = '';

  public isGenerating = false;
  public isPublishing = false;
  public isLoadingReportDetails = false;
  public isSavingReport = false;
  public isDeletingReport = false;

  public draft: WeeklyReport | null = null;
  public publishedReports: WeeklyReport[] = [];
  public selectedReport: WeeklyReport | null = null;
  public selectedReportNotes = '';
  public selectedExcludedReportIds: string[] = [];

  public errorMessage = '';
  public successMessage = '';

  constructor(
    private router: Router,
    private weeklyReportService: WeeklyReportService
  ) {}

  ngOnInit(): void {
    this.calculateCurrentWeek();
    void this.loadPublishedReports();
  }

  private calculateCurrentWeek(): void {
    const now = new Date();
    const tempDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - (tempDate.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    this.weekNumber = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(8, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(22, 0, 0, 0);

    this.weekDateRange = `${this.formatDate(monday.toISOString())} - ${this.formatDate(sunday.toISOString())}`;
    this.startDate = monday.toISOString();
    this.endDate = sunday.toISOString();
  }

  private getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallbackMessage;
  }

  private getSummary(report: WeeklyReport | null | undefined): WeeklyReportSummary {
    return report?.summary_json ?? {};
  }

  async loadPublishedReports(): Promise<void> {
    try {
      const all = await this.weeklyReportService.getReports();
      this.publishedReports = all
        .filter((report) => report.status === 'published')
        .sort(
          (left, right) =>
            new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
        );
    } catch (error) {
      console.error('Error loading reports:', error);
      this.errorMessage = this.getErrorMessage(
        error,
        'No se pudieron cargar los informes publicados.'
      );
    }
  }

  async generateReport(): Promise<void> {
    this.isGenerating = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const response = await this.weeklyReportService.generateReport(this.adminNotes);
      this.draft = response.report;
      this.successMessage =
        'Borrador generado correctamente. Revisa el resumen y publica cuando estes listo.';
    } catch (error) {
      const message = this.getErrorMessage(error, 'No se pudo generar el informe semanal.');
      this.errorMessage = `Error al generar el informe: ${message}`;
    } finally {
      this.isGenerating = false;
    }
  }

  async publishDraft(): Promise<void> {
    if (!this.draft?.id) {
      return;
    }

    this.isPublishing = true;
    this.errorMessage = '';

    try {
      await this.weeklyReportService.publishReport(this.draft.id, this.adminNotes);
      this.successMessage = 'Informe publicado exitosamente. Los guardias ya pueden verlo.';
      this.draft = null;
      this.adminNotes = '';
      await this.loadPublishedReports();
    } catch (error) {
      const message = this.getErrorMessage(error, 'No se pudo publicar el informe semanal.');
      this.errorMessage = `Error al publicar: ${message}`;
    } finally {
      this.isPublishing = false;
    }
  }

  discardDraft(): void {
    this.draft = null;
    this.adminNotes = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  async openPublishedReport(report: WeeklyReport): Promise<void> {
    this.isLoadingReportDetails = true;
    this.errorMessage = '';

    try {
      const loadedReport = await this.weeklyReportService.getReport(report.id);
      this.selectedReport = loadedReport;
      this.selectedReportNotes = loadedReport.admin_notes ?? '';
      this.selectedExcludedReportIds = [
        ...(this.getSummary(loadedReport).excluded_report_ids ?? [])
      ];
    } catch (error) {
      const message = this.getErrorMessage(error, 'No se pudo cargar el detalle del informe.');
      this.errorMessage = `Error al cargar detalle: ${message}`;
    } finally {
      this.isLoadingReportDetails = false;
    }
  }

  closeSelectedReport(): void {
    this.selectedReport = null;
    this.selectedReportNotes = '';
    this.selectedExcludedReportIds = [];
  }

  async saveSelectedReport(): Promise<void> {
    if (!this.selectedReport?.id) {
      return;
    }

    this.isSavingReport = true;
    this.errorMessage = '';

    try {
      const response = await this.weeklyReportService.updateReport(this.selectedReport.id, {
        admin_notes: this.selectedReportNotes.trim(),
        excluded_report_ids: this.selectedExcludedReportIds
      });

      this.selectedReport = response.report;
      this.selectedReportNotes = response.report.admin_notes ?? '';
      this.selectedExcludedReportIds = [
        ...(this.getSummary(response.report).excluded_report_ids ?? [])
      ];
      this.successMessage = 'Informe semanal actualizado correctamente.';
      await this.loadPublishedReports();
    } catch (error) {
      const message = this.getErrorMessage(error, 'No se pudo actualizar el informe semanal.');
      this.errorMessage = `Error al guardar cambios: ${message}`;
    } finally {
      this.isSavingReport = false;
    }
  }

  async deleteSelectedReport(): Promise<void> {
    if (!this.selectedReport?.id || typeof window === 'undefined') {
      return;
    }

    const confirmed = window.confirm(
      'Se eliminara este reporte semanal completo. Esta accion no se puede deshacer.'
    );

    if (!confirmed) {
      return;
    }

    this.isDeletingReport = true;
    this.errorMessage = '';

    try {
      await this.weeklyReportService.deleteReport(this.selectedReport.id);
      this.successMessage = 'Informe semanal eliminado correctamente.';
      this.closeSelectedReport();
      await this.loadPublishedReports();
    } catch (error) {
      const message = this.getErrorMessage(error, 'No se pudo eliminar el informe semanal.');
      this.errorMessage = `Error al eliminar: ${message}`;
    } finally {
      this.isDeletingReport = false;
    }
  }

  public toggleIncidentExclusion(incidentId: string): void {
    const isExcluded = this.selectedExcludedReportIds.includes(incidentId);
    this.selectedExcludedReportIds = isExcluded
      ? this.selectedExcludedReportIds.filter((id) => id !== incidentId)
      : [...this.selectedExcludedReportIds, incidentId];
  }

  public isIncidentExcluded(incidentId: string): boolean {
    return this.selectedExcludedReportIds.includes(incidentId);
  }

  public getSelectedReportSourceIncidents(): WeeklyReportIncident[] {
    return this.getSummary(this.selectedReport).source_reports ?? [];
  }

  public getSelectedReportIncludedCount(): number {
    return this.getSummary(this.selectedReport).total_reports ?? 0;
  }

  public getSelectedReportExcludedCount(): number {
    return this.selectedExcludedReportIds.length;
  }

  public formatDate(iso: string): string {
    const date = new Date(iso);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  public formatDateTime(iso: string): string {
    const date = new Date(iso);
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${this.formatDate(iso)} ${hours}:${minutes}`;
  }

  public navigateTo(event: Event, path: string): void {
    event.preventDefault();
    void this.router.navigate([path]);
  }

  public statusLabel(status: string): string {
    const map: Record<string, string> = {
      completed: 'Completados',
      in_process: 'En proceso',
      pending: 'Pendientes'
    };

    return map[status] ?? status;
  }

  public incidentStatusClasses(status: string): string {
    const baseClasses =
      'inline-flex items-center rounded-xl border px-3 py-1 text-[10px] font-black uppercase tracking-wider';

    switch (status) {
      case 'completed':
        return `border-emerald-500/30 bg-emerald-500/10 text-emerald-400 ${baseClasses}`;
      case 'in_process':
        return `border-amber-500/30 bg-amber-500/10 text-amber-400 ${baseClasses}`;
      default:
        return `border-rose-500/30 bg-rose-500/10 text-rose-400 ${baseClasses}`;
    }
  }
}
