import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReportService } from '../../services/report.service';
import { GuardService } from '../../services/guard.service';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('hourlyChart') hourlyChartCanvas!: ElementRef;
  @ViewChild('guardsChart') guardsChartCanvas!: ElementRef;
  @ViewChild('categoryChart') categoryChartCanvas!: ElementRef;

  public isLoading = true;
  public totalIncidentes = 0;
  public topGuardia = 'N/A';
  public zonaMasActiva = 'N/A';
  
  private reports: any[] = [];
  private charts: any[] = [];

  constructor(
    private reportService: ReportService,
    private guardService: GuardService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      await this.loadData();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && !this.isLoading) {
      this.initCharts();
    }
  }

  private async loadData() {
    try {
      this.reports = await this.reportService.getReports();
      this.totalIncidentes = this.reports.length;
      
      // Procesar datos para KPI básicos
      this.processKPis();
      
      this.isLoading = false;
      // Pequeño delay para asegurar que el DOM se renderizó si isLoading cambió
      setTimeout(() => this.initCharts(), 100);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      this.isLoading = false;
    }
  }

  private processKPis() {
    if (this.reports.length === 0) return;

    // Calcular Top Guardia
    const guardCounts: { [key: string]: number } = {};
    const zoneCounts: { [key: string]: number } = {};

    this.reports.forEach(r => {
      const guardName = this.extractGuardName(r.short_description);
      if (guardName) {
        guardCounts[guardName] = (guardCounts[guardName] || 0) + 1;
      }

      const zoneName = this.extractAreaName(r.short_description) || 'Área General';
      zoneCounts[zoneName] = (zoneCounts[zoneName] || 0) + 1;
    });

    // Top Guardia solo entre humanos
    const sortedHumanGuards = Object.entries(guardCounts).sort((a,b) => b[1] - a[1]);
    this.topGuardia = sortedHumanGuards[0]?.[0] || 'Sin actividad';
    this.zonaMasActiva = Object.entries(zoneCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Área General';
  }

  private initCharts() {
    // Destruir charts previos si existen
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    this.createHourlyChart();
    this.createGuardsChart();
    this.createCategoryChart();
  }

  private createHourlyChart() {
    const ctx = this.hourlyChartCanvas.nativeElement.getContext('2d');
    
    // Agrupar por hora (0-23)
    const hourData = new Array(24).fill(0);
    this.reports.forEach(r => {
      const hour = new Date(r.created_at).getHours();
      hourData[hour]++;
    });

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        datasets: [{
          label: 'Incidentes por Hora',
          data: hourData,
          borderColor: '#7000FF',
          backgroundColor: 'rgba(112, 0, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#7000FF'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  private createGuardsChart() {
    const ctx = this.guardsChartCanvas.nativeElement.getContext('2d');
    
    const guardCounts: { [key: string]: number } = {};
    this.reports.forEach(r => {
      const guardName = this.extractGuardName(r.short_description);
      // Solo sumamos si hay un nombre de guardia humano
      if (guardName) {
        guardCounts[guardName] = (guardCounts[guardName] || 0) + 1;
      }
    });

    // Ordenar y tomar los mejores guardias humanos
    const sortedGuards = Object.entries(guardCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedGuards.map(g => g[0]),
        datasets: [{
          label: 'Reportes',
          data: sortedGuards.map(g => g[1]),
          backgroundColor: [
            'rgba(112, 0, 255, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(239, 68, 68, 0.6)'
          ],
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b' }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  private createCategoryChart() {
    const ctx = this.categoryChartCanvas.nativeElement.getContext('2d');
    
    const typeMap: { [key: number]: string } = { 1: 'Incidente', 2: 'Novedad', 3: 'Rondín', 4: 'Alerta IA', 5: 'Mantenimiento', 6: 'Sospechoso', 7: 'Emergencia' };
    const typeCounts: { [key: string]: number } = {};

    this.reports.forEach(r => {
      const type = typeMap[r.report_type_id] || 'Otro';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(typeCounts),
        datasets: [{
          data: Object.values(typeCounts),
          backgroundColor: [
            '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#7000FF', '#6366f1', '#ec4899'
          ],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#64748b', boxWidth: 12, font: { size: 10 } }
          }
        }
      }
    });
    this.charts.push(chart);
  }

  private extractGuardName(desc: string): string | null {
    if (!desc) return null;
    const match = desc.match(/Guardia: ([^|]+)/);
    return match ? match[1].split('(')[0].trim() : null;
  }

  private isAIReport(r: any): boolean {
    return !r.created_by_guard_id || (r.short_description && r.short_description.includes('IA'));
  }

  private extractAreaName(desc: string): string | null {
    if (!desc) return null;
    const match = desc.match(/Area:\s*([^|]+)/);
    return match ? match[1].trim() : null;
  }

  public viewMap() {
    this.router.navigate(['/dashboard/mapa'], { queryParams: { heatmap: 'true' } });
  }
}
