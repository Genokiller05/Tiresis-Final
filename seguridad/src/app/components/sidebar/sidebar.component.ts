import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  // Badge counts
  public pendingAlertsCount: number = 0;

  // Admin avatar
  public adminInitials: string = 'A';
  public adminPhotoUrl: string | null = null;
  public adminName: string = 'Admin';

  // System status
  public systemStatus: 'OPERATIVO' | 'DEGRADADO' | 'OFFLINE' = 'OPERATIVO';
  public pingMs: string = '--';

  // Click animation tracking
  public clickedRoute: string | null = null;

  // Notifications Popover
  public isNotificationsOpen: boolean = false;
  public alerts: any[] = [];
  public activeFilter: 'Todas' | 'Pendientes' | 'Estado' = 'Todas';

  // Status Dropdown state
  public isStatusDropdownOpen: boolean = false;
  public selectedStatus: string = 'Pendiente';
  public statusOptions: string[] = ['Pendiente', 'En proceso', 'Completado', 'Cancelado', 'Suspendido'];

  private refreshSubscription!: Subscription;
  private realtimeSubscription!: Subscription;

  constructor(
    private router: Router,
    private reportService: ReportService,
    private authService: AuthService,
    private eRef: ElementRef
  ) { }

  // Close notifications if clicking outside
  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isNotificationsOpen = false;
      this.isStatusDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    this.loadAdminProfile();
    this.loadAllBadges();
    this.measurePing();

    // Auto-refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadAllBadges();
      this.measurePing();
    });

    // Realtime updates from DB
    this.realtimeSubscription = this.reportService.getReportUpdates().subscribe(() => {
      this.loadPendingAlerts();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
  }

  // #7 — Load admin profile for avatar
  private loadAdminProfile(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.adminName = user.nombre || user.name || user.full_name || 'Admin';
      this.adminPhotoUrl = user.photoUrl || user.photo_url || user.avatar_url || null;
      // Generate initials from name
      const parts = this.adminName.trim().split(' ');
      this.adminInitials = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : this.adminName.substring(0, 2).toUpperCase();
    }
  }

  // Load all badge data
  private async loadAllBadges(): Promise<void> {
    await this.loadPendingAlerts();
  }

  // #3 — Alert badge (pending alerts)
  private async loadPendingAlerts(): Promise<void> {
    try {
      const rawReports = await this.reportService.getReports();
      const mappedReports = rawReports.map((r: any) => this.mapReport(r));

      // Guardar y ordenar alertas más recientes arriba
      this.alerts = mappedReports.sort((a: any, b: any) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

      this.pendingAlertsCount = mappedReports.filter(
        (r: any) => r.estado?.toUpperCase() === 'PENDIENTE' || r.estado?.toUpperCase() === 'NUEVO' || r.estado?.toUpperCase() === 'SUSPENDIDO'
      ).length;
    } catch {
      // Keep previous count on error
    }
  }

  // Map DB representation to UI representation
  private mapReport(dbReport: any): any {
    const statusMap: { [key: number]: string } = { 1: 'Pendiente', 2: 'En proceso', 3: 'Completado', 31: 'Cancelado', 32: 'Suspendido' };
    const typeMap: { [key: number]: string } = { 1: 'Incidente', 2: 'Novedad', 3: 'Rondín', 4: 'Alerta recibida', 5: 'Mantenimiento', 6: 'Sospechoso', 7: 'Emergencia' };

    let parsedArea = 'Área Asignada';
    let parsedDescription = dbReport.short_description || 'Sin descripción';

    if (dbReport.short_description) {
      let tempDesc = dbReport.short_description;

      const areaMatch = tempDesc.match(/Area:\s*([^|]+)/);
      if (areaMatch && areaMatch[1]) {
        parsedArea = areaMatch[1].trim();
        tempDesc = tempDesc.replace(areaMatch[0], '').replace(/^\|\s*/, '').replace(/\|\s*\|\s*/, '|').trim();
      }

      // Cleanup desc for UI
      tempDesc = tempDesc.replace(/Evidencia: (http[s]?:\/\/[^\s]+)/, '').replace(/Guardia: ([^|]+)/, '').replace(/\|\s*$/, '').replace(/\|\s*\|\s*/, '|').trim();
      if (tempDesc) parsedDescription = tempDesc;
    }

    return {
      id: dbReport.id,
      fechaHora: dbReport.created_at || new Date().toISOString(),
      origen: dbReport.created_by_guard_id ? 'Guardia' : 'IA',
      tipo: typeMap[dbReport.report_type_id] || 'Incidente',
      estado: statusMap[dbReport.status_id] || 'Pendiente',
      sitioArea: parsedArea,
      descripcion: parsedDescription
    };
  }

  // Toggle notifications popover
  toggleNotifications(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isStatusDropdownOpen = false;
    // Navegar y mostrar desplegable al mismo tiempo
    this.navigateTo(event, '/dashboard/alertas');
  }

  // Close notifications popover
  closeNotifications(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isNotificationsOpen = false;
  }

  // Filter for Idea 1
  get filteredAlerts() {
    let filtered = this.alerts;

    if (this.activeFilter === 'Pendientes') {
      filtered = filtered.filter(a => a.estado?.trim().toUpperCase() === 'PENDIENTE' || a.estado?.trim().toUpperCase() === 'NUEVO' || a.estado?.trim().toUpperCase() === 'SUSPENDIDO');
    } else if (this.activeFilter === 'Estado') {
      filtered = filtered.filter(a => a.estado?.trim().toUpperCase() === this.selectedStatus.trim().toUpperCase());
    }

    return filtered.slice(0, 15);
  }

  setFilter(filter: 'Todas' | 'Pendientes' | 'Estado', event: Event) {
    event.stopPropagation();
    this.activeFilter = filter;
    if (filter !== 'Estado') {
      this.isStatusDropdownOpen = false;
    }

    if (this.isActive('/dashboard/alertas')) {
      let queryParams: any = {};
      if (filter === 'Pendientes') queryParams.status = 'Pendiente';
      else if (filter === 'Todas') queryParams.status = 'Todos';
      this.router.navigate(['/dashboard/alertas'], { queryParams });
    }
  }

  get footerButtonText(): string {
    if (this.activeFilter === 'Todas') return 'VER CENTRO DE ALERTAS';
    if (this.activeFilter === 'Pendientes') return 'VER PENDIENTES';
    if (this.activeFilter === 'Estado') {
      if (this.selectedStatus.toUpperCase() === 'EN PROCESO') return 'VER EN PROCESO';
      return `VER ${this.selectedStatus.toUpperCase()}S`;
    }
    return 'VER CENTRO DE ALERTAS';
  }

  toggleStatusDropdown(event: Event) {
    event.stopPropagation();
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
  }

  selectStatus(status: string, event: Event) {
    event.stopPropagation();
    this.selectedStatus = status;
    this.activeFilter = 'Estado';
    this.isStatusDropdownOpen = false;

    if (this.isActive('/dashboard/alertas')) {
      this.router.navigate(['/dashboard/alertas'], { queryParams: { status } });
    }
  }


  // #8 — Measure ping to evaluate system status (public /api/ping endpoint)
  private async measurePing(): Promise<void> {
    const start = performance.now();
    try {
      await fetch('http://localhost:3000/api/ping', { signal: AbortSignal.timeout(3000) });
      const ms = Math.round(performance.now() - start);
      this.pingMs = `${ms}`;
      this.systemStatus = ms < 300 ? 'OPERATIVO' : 'DEGRADADO';
    } catch {
      this.pingMs = '--';
      this.systemStatus = 'OFFLINE';
    }
  }

  // #10 — Navigation with click animation
  navigateTo(event: Event, path: string): void {
    console.log('[Sidebar] Navigating to:', path);
    event.preventDefault();
    this.clickedRoute = path;
    setTimeout(() => {
      this.clickedRoute = null;
      console.log('[Sidebar] Router navigation executing:', path);
      this.router.navigate([path]);
      // Refresh badges when leaving alerts
      if (path !== '/dashboard/alertas') {
        setTimeout(() => this.loadPendingAlerts(), 500);
      }
    }, 300);
  }

  navigateToFilteredAlerts(event: Event): void {
    event.preventDefault();
    this.isNotificationsOpen = false;
    this.clickedRoute = '/dashboard/alertas';
    setTimeout(() => {
      this.clickedRoute = null;
      let queryParams: any = {};

      if (this.activeFilter === 'Pendientes') {
        queryParams.status = 'Pendiente';
      } else if (this.activeFilter === 'Estado') {
        queryParams.status = this.selectedStatus;
      }

      this.router.navigate(['/dashboard/alertas'], { queryParams });
    }, 300);
  }

  navigateToAlert(event: Event, alertId: string): void {
    event.preventDefault();
    event.stopPropagation();

    this.isNotificationsOpen = false;
    this.clickedRoute = '/dashboard/alertas';
    setTimeout(() => {
      this.clickedRoute = null;
      this.router.navigate(['/dashboard/alertas'], { queryParams: { alertId: alertId } });
    }, 300);
  }

  isActive(route: string): boolean {
    const active = this.router.url === route;
    if (route === '/dashboard/camaras' && active) {
      console.log('[Sidebar] Cameras route is active');
    }
    return active;
  }

  isClicked(route: string): boolean {
    return this.clickedRoute === route;
  }
}
