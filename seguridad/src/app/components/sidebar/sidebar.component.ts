import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { CameraService } from '../../services/camera.service';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  // Badge counts
  public pendingAlertsCount: number = 0;
  public offlineCamerasCount: number = 0;

  // Admin avatar
  public adminInitials: string = 'A';
  public adminPhotoUrl: string | null = null;
  public adminName: string = 'Admin';

  // System status
  public systemStatus: 'OPERATIVO' | 'DEGRADADO' | 'OFFLINE' = 'OPERATIVO';
  public pingMs: string = '--';

  // Click animation tracking
  public clickedRoute: string | null = null;

  private refreshSubscription!: Subscription;

  constructor(
    private router: Router,
    private reportService: ReportService,
    private cameraService: CameraService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadAdminProfile();
    this.loadAllBadges();
    this.measurePing();

    // Auto-refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadAllBadges();
      this.measurePing();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
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
    await Promise.allSettled([
      this.loadPendingAlerts(),
      this.loadOfflineCameras()
    ]);
  }

  // #3 — Alert badge (pending alerts)
  private async loadPendingAlerts(): Promise<void> {
    try {
      const reports = await this.reportService.getReports();
      this.pendingAlertsCount = reports.filter(
        (r: any) => r.estado !== 'Resuelto' && r.estado !== 'Completado' && r.estado !== 'Cancelado'
      ).length;
    } catch {
      // Keep previous count on error
    }
  }

  // #11 — Camera offline badge
  private async loadOfflineCameras(): Promise<void> {
    try {
      const cameras = await this.cameraService.getCameras();
      this.offlineCamerasCount = cameras.filter(
        (c: any) => c.estado === 'Offline' || c.estado === 'offline' || c.status === 'offline'
      ).length;
    } catch {
      // Keep previous count on error
    }
  }

  // #8 — Measure ping to evaluate system status
  private async measurePing(): Promise<void> {
    const start = performance.now();
    try {
      await fetch('http://localhost:3000/api/cameras', { method: 'HEAD', signal: AbortSignal.timeout(3000) });
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
    event.preventDefault();
    this.clickedRoute = path;
    setTimeout(() => {
      this.clickedRoute = null;
      this.router.navigate([path]);
      // Refresh badges when leaving alerts
      if (path !== '/dashboard/alertas') {
        setTimeout(() => this.loadPendingAlerts(), 500);
      }
    }, 300);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  isClicked(route: string): boolean {
    return this.clickedRoute === route;
  }
}
