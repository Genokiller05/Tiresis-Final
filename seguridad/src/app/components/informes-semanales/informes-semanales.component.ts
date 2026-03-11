import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WeeklyReportService } from '../../services/weekly-report.service';

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
  public draft: any = null;
  public publishedReports: any[] = [];
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

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const formatDate = (date: Date) => `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;

    this.weekDateRange = `${formatDate(monday)} - ${formatDate(sunday)}`;
    this.startDate = monday.toISOString();
    this.endDate = sunday.toISOString();
  }

  private getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallbackMessage;
  }

  async loadPublishedReports(): Promise<void> {
    try {
      const all = await this.weeklyReportService.getReports();
      this.publishedReports = all
        .filter((report: any) => report.status === 'published')
        .sort(
          (left: any, right: any) =>
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

  public formatDate(iso: string): string {
    const date = new Date(iso);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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
}
