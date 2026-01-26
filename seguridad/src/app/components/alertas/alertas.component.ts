import { Component, OnInit, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service';
import { ReportService } from '../../services/report.service';
import { Subscription } from 'rxjs';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule], // Eliminar SidebarComponent de imports
  templateUrl: './alertas.component.html',
  styleUrl: './alertas.component.css'
})
export class AlertasComponent implements OnInit, OnDestroy, AfterViewInit {

  public allAlerts: any[] = [];

  // Flatpickr instances
  private datePickerDesde: any;
  private datePickerHasta: any;

  // Public properties for data binding
  public displayedAlerts: any[] = [];
  public filterDesde: string = '';
  public filterHasta: string = '';
  public filterOrigen: string = 'Guardia';
  public filterTipo: string = 'Todos';

  public isDeleteModalVisible: boolean = false;
  public alertToDelete: any = null;

  // Properties for status modification modal
  public isStatusModalVisible: boolean = false;
  public alertToModify: any = null;
  public selectedStatus: string = '';
  public statusOptions: string[] = ['Pendiente', 'En proceso', 'Completado', 'Cancelado', 'Suspendido'];

  // Properties for details modal
  public isDetailsModalVisible: boolean = false;
  public alertToShowDetails: any = null;

  // Theme property
  public currentTheme: 'light' | 'dark' = 'dark';

  // Logout Modal property
  public isLogoutModalVisible: boolean = false;

  // Language properties
  public uiText: any = {};
  private langSubscription!: Subscription;
  private themeSubscription!: Subscription;

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private translationService: TranslationService,
    private reportService: ReportService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchReports();
    }
    this.langSubscription = this.translationService.uiText.subscribe(translations => {
      this.uiText = translations?.alertas || {};
    });
    this.themeSubscription = this.themeService.currentTheme.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initFlatpickr();
    }
  }

  private initFlatpickr() {
    const config = {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      locale: Spanish,
      altInput: true,
      altFormat: "d/m/Y H:i",
      time_24hr: true
    };

    const desdeInput = document.getElementById('filter-desde');
    const hastaInput = document.getElementById('filter-hasta');

    if (desdeInput) {
      this.datePickerDesde = flatpickr(desdeInput, {
        ...config,
        defaultDate: this.filterDesde,
        onChange: (selectedDates, dateStr) => {
          this.filterDesde = dateStr;
          this.aplicarFiltros();
        }
      });
    }

    if (hastaInput) {
      this.datePickerHasta = flatpickr(hastaInput, {
        ...config,
        defaultDate: this.filterHasta,
        onChange: (selectedDates, dateStr) => {
          this.filterHasta = dateStr;
          this.aplicarFiltros();
        }
      });
    }
  }

  async fetchReports() {
    try {
      this.allAlerts = await this.reportService.getReports();
    } catch (error) {
      console.error('Error fetching reports:', error);
      this.allAlerts = [];
    }
    this.aplicarFiltros();
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    // Destroy Flatpickr instances
    if (this.datePickerDesde) {
      this.datePickerDesde.destroy();
    }
    if (this.datePickerHasta) {
      this.datePickerHasta.destroy();
    }
  }

  // --- Theme Methods ---
  public setTheme(theme: 'light' | 'dark'): void {
    this.themeService.setTheme(theme);
  }

  // --- Logout Modal Methods ---
  public showLogoutModal(): void {
    this.isLogoutModalVisible = true;
  }

  public hideLogoutModal(): void {
    this.isLogoutModalVisible = false;
  }

  public confirmLogout(): void {
    this.authService.logout(); // Usar el servicio de autenticación
    this.router.navigate(['/login']);
  }

  // --- Actions Menu ---
  public toggleMenu(alerta: any): void {
    // Cierra cualquier otro menú que esté abierto
    this.displayedAlerts.forEach(a => {
      if (a !== alerta) {
        a.menuVisible = false;
      }
    });
    // Muestra u oculta el menú de la alerta seleccionada
    alerta.menuVisible = !alerta.menuVisible;
  }

  // Modified modificarEstado to use custom modal
  public modificarEstado(alerta: any): void {
    this.alertToModify = alerta;
    this.selectedStatus = alerta.estado; // Pre-select current status
    this.isStatusModalVisible = true;
    alerta.menuVisible = false; // Ocultar menú después de la acción
  }

  // New methods for status modification modal
  public showStatusModal(alerta: any): void {
    this.alertToModify = alerta;
    this.selectedStatus = alerta.estado;
    this.isStatusModalVisible = true;
  }

  public hideStatusModal(): void {
    this.isStatusModalVisible = false;
    this.alertToModify = null;
    this.selectedStatus = '';
  }

  async confirmStatusChange() {
    if (this.alertToModify && this.selectedStatus) {
      this.alertToModify.estado = this.selectedStatus;

      try {
        await this.reportService.updateReport(this.alertToModify.id, { estado: this.selectedStatus });

        // Update local state is handled by re-fetching or optimistic update. 
        // Here we just modified the object reference, which is displayed.
        // But better to fetch fresh data or update array carefully.
        // The modifying of 'alertToModify' already updated the object in memory if it's the same ref.

        this.aplicarFiltros();
      } catch (error) {
        console.error('Error updating report status:', error);
        // Revert change if needed
      }
    }
    this.hideStatusModal();
  }

  // --- Details Modal ---
  public mostrarDetalles(alerta: any): void {
    this.alertToShowDetails = alerta;
    this.isDetailsModalVisible = true;
    alerta.menuVisible = false;
  }

  public hideDetailsModal(): void {
    this.isDetailsModalVisible = false;
    this.alertToShowDetails = null;
  }

  public eliminarAlerta(alerta: any): void {
    this.alertToDelete = alerta;
    this.isDeleteModalVisible = true;
    alerta.menuVisible = false;
  }

  async confirmDelete() {
    if (!this.alertToDelete) return;

    try {
      await this.reportService.deleteReport(this.alertToDelete.id);

      // Remove from local array to update UI immediately
      this.allAlerts = this.allAlerts.filter(a => a.id !== this.alertToDelete.id);

      this.aplicarFiltros();
    } catch (error) {
      console.error('Error deleting report:', error);
    }

    this.hideDeleteModal();
  }

  public hideDeleteModal(): void {
    this.isDeleteModalVisible = false;
    this.alertToDelete = null;
  }

  // --- Filtering Logic ---
  public aplicarFiltros(): void {
    // Parse filter dates properly
    const desdeDate = this.filterDesde ? new Date(this.filterDesde) : null;
    let hastaDate = this.filterHasta ? new Date(this.filterHasta) : null;

    // Set hasta to end of day if provided
    if (hastaDate) {
      hastaDate.setHours(23, 59, 59, 999);
    }

    const filtered = this.allAlerts.filter(alerta => {
      // Parse alert date
      const fechaAlerta = new Date(alerta.fechaHora);

      // Apply date filters
      if (desdeDate && fechaAlerta < desdeDate) return false;
      if (hastaDate && fechaAlerta > hastaDate) return false;

      // Apply origin filter
      if (this.filterOrigen !== 'Todos' && alerta.origen !== this.filterOrigen) return false;

      // Apply type filter
      if (this.filterTipo !== 'Todos' && alerta.tipo !== this.filterTipo) return false;

      return true;
    });

    // Sort by date descending (newest first)
    this.displayedAlerts = filtered.sort((a, b) => {
      const dateA = new Date(a.fechaHora).getTime();
      const dateB = new Date(b.fechaHora).getTime();
      return dateB - dateA;
    });
  }

  public limpiarFiltros(): void {
    this.filterDesde = '';
    this.filterHasta = '';
    this.filterOrigen = 'Todos';
    this.filterTipo = 'Todos';
    this.aplicarFiltros();
  }

  // --- Chip Styling ---
  public getOriginChipClasses(origen: string): string {
    switch (origen) {
      case 'IA':
        return 'bg-purple-500/20 text-purple-400 font-medium py-1 px-3 rounded-full text-xs';
      case 'Guardia':
        return 'bg-blue-500/20 text-blue-400 font-medium py-1 px-3 rounded-full text-xs';
      default:
        return 'bg-gray-500/20 text-gray-400 font-medium py-1 px-3 rounded-full text-xs';
    }
  }

  public getStatusChipClasses(estado: string): string {
    const baseClasses = 'font-medium py-1 px-3 rounded-full text-xs';
    switch (estado) {
      case 'Pendiente':
        return `bg-yellow-500/20 text-yellow-400 ${baseClasses}`;
      case 'En proceso':
        return `bg-blue-500/20 text-blue-400 ${baseClasses}`;
      case 'Completado':
        return `bg-green-500/20 text-green-400 ${baseClasses}`;
      case 'Cancelado':
        return `bg-red-500/20 text-red-400 ${baseClasses}`;
      case 'Suspendido':
        return `bg-gray-500/20 text-gray-400 ${baseClasses}`;
      default:
        return `bg-gray-500/20 text-gray-400 ${baseClasses}`;
    }
  }
}