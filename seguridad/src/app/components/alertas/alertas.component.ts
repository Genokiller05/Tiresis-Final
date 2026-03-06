import { Component, OnInit, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service';
import { ReportService } from '../../services/report.service';
import { Subscription } from 'rxjs';
import * as flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import { ViewChild, ElementRef } from '@angular/core';

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
  @ViewChild('filterDesdeInput') filterDesdeInput!: ElementRef;
  @ViewChild('filterHastaInput') filterHastaInput!: ElementRef;
  private datePickerDesde: any;
  private datePickerHasta: any;

  // Public properties for data binding
  public displayedAlerts: any[] = [];
  public filterDesde: string = '';
  public filterHasta: string = '';
  public filterOrigen: string = 'Guardia';
  public filterTipo: string = 'Todos';
  public filterEstado: string = 'Todos';

  public isDeleteModalVisible: boolean = false;
  public alertToDelete: any = null;

  // Dropdown States
  public isTipoDropdownOpen: boolean = false;
  public isModalStatusDropdownOpen: boolean = false;

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
  private realtimeSubscription!: Subscription;
  private querySub!: Subscription;
  public initialOpenAlertId: string | null = null;

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private translationService: TranslationService,
    private reportService: ReportService,
    private authService: AuthService,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  async ngOnInit(): Promise<void> {
    this.querySub = this.route.queryParams.subscribe(params => {
      if (params['alertId']) {
        const id = params['alertId'];
        this.openAlertById(id);
      }
      if (params['status']) {
        this.filterEstado = params['status'];
        this.aplicarFiltros();
      } else if (Object.keys(params).length === 0 || (!params['status'] && !params['alertId'])) {
        this.filterEstado = 'Todos';
        this.aplicarFiltros();
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      this.fetchReports();
    }
    this.langSubscription = this.translationService.uiText.subscribe(translations => {
      this.uiText = translations?.alertas || {};
    });
    this.themeSubscription = this.themeService.currentTheme.subscribe(theme => {
      this.currentTheme = theme;
    });

    if (isPlatformBrowser(this.platformId)) {
      this.realtimeSubscription = this.reportService.getReportUpdates().subscribe(payload => {
        this.handleRealtimeEvent(payload);
      });
    }
  }

  private handleRealtimeEvent(payload: any) {
    if (payload.eventType === 'INSERT') {
      // Add new record if not exists
      const mappedNew = this.mapReportFromDB(payload.new);
      const exists = this.allAlerts.find(a => a.id === mappedNew.id);
      if (!exists) {
        this.allAlerts.unshift(mappedNew);
      }
    } else if (payload.eventType === 'UPDATE') {
      // Update existing
      const mappedUpdate = this.mapReportFromDB(payload.new);
      const index = this.allAlerts.findIndex(a => a.id === mappedUpdate.id);
      if (index !== -1) {
        this.allAlerts[index] = mappedUpdate;
      }
    } else if (payload.eventType === 'DELETE') {
      // Remove deleted
      this.allAlerts = this.allAlerts.filter(a => a.id !== payload.old.id);
    }
    // Re-apply filters
    this.aplicarFiltros();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initFlatpickr();
    }
  }

  private initFlatpickr() {
    console.log('Inicializando Flatpickr en Alertas...');
    const config: any = {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      locale: Spanish,
      allowInput: true,
      time_24hr: true,
      disableMobile: true,
      static: true,
    };

    if (this.filterDesdeInput) {
      this.datePickerDesde = (flatpickr as any).default(this.filterDesdeInput.nativeElement, {
        ...config,
        defaultDate: this.filterDesde,
        onChange: (selectedDates: any, dateStr: string) => {
          this.filterDesde = dateStr;
          this.aplicarFiltros();
        }
      });
      console.log('DatePicker Desde (Alertas) inicializado');
    }

    if (this.filterHastaInput) {
      this.datePickerHasta = (flatpickr as any).default(this.filterHastaInput.nativeElement, {
        ...config,
        defaultDate: this.filterHasta,
        onChange: (selectedDates: any, dateStr: string) => {
          this.filterHasta = dateStr;
          this.aplicarFiltros();
        }
      });
      console.log('DatePicker Hasta (Alertas) inicializado');
    }
  }

  private mapReportFromDB(dbReport: any): any {
    // Definimos mapas básicos para los IDs numéricos al texto que espera la interfaz
    const statusMap: { [key: number]: string } = { 1: 'Pendiente', 2: 'En proceso', 3: 'Completado', 31: 'Cancelado', 32: 'Suspendido' };
    const typeMap: { [key: number]: string } = { 1: 'Incidente', 2: 'Novedad', 3: 'Rondín', 4: 'Alerta recibida', 5: 'Mantenimiento', 6: 'Sospechoso', 7: 'Emergencia' };

    let parsedArea = 'Área Asignada';
    let parsedDescription = dbReport.short_description || 'Sin descripción detallada.';
    let parsedEvidence = null;
    let parsedGuardName = 'Guardia Registrado';
    let parsedGuardID = dbReport.created_by_guard_id || 'N/A';

    if (dbReport.short_description && typeof dbReport.short_description === 'string') {
      let tempDesc = dbReport.short_description;

      const evidenceMatch = tempDesc.match(/Evidencia: (http[s]?:\/\/[^\s]+)/);
      if (evidenceMatch && evidenceMatch[1]) {
        parsedEvidence = evidenceMatch[1];
        tempDesc = tempDesc.replace(evidenceMatch[0], '').replace(/\|\s*$/, '').trim();
      }

      const guardMatch = tempDesc.match(/Guardia: ([^|]+)/);
      if (guardMatch && guardMatch[1]) {
        const idMatch = guardMatch[1].match(/ID:\s*(\d+)/);
        if (idMatch && idMatch[1]) {
          parsedGuardID = idMatch[1];
        }
        parsedGuardName = guardMatch[1].replace(/\(.*?\)/g, '').trim();
        tempDesc = tempDesc.replace(guardMatch[0], '').replace(/\|\s*\|\s*/, '|').replace(/\|\s*$/, '').trim();
      }

      const areaMatch = tempDesc.match(/Area:\s*([^|]+)/);
      if (areaMatch && areaMatch[1]) {
        parsedArea = areaMatch[1].trim();
        tempDesc = tempDesc.replace(areaMatch[0], '').replace(/^\|\s*/, '').replace(/\|\s*\|\s*/, '|').trim();
      }

      parsedDescription = tempDesc;
    }

    return {
      id: dbReport.id,
      fechaHora: dbReport.created_at || new Date().toISOString(),
      origen: dbReport.created_by_guard_id ? 'Guardia' : 'IA',
      tipo: typeMap[dbReport.report_type_id] || 'Incidente',
      sitioArea: parsedArea,
      estado: statusMap[dbReport.status_id] || 'Pendiente',
      detalles: {
        descripcion: parsedDescription,
        nombreGuardia: parsedGuardName,
        idGuardia: parsedGuardID,
        evidencia: parsedEvidence
      },
      _rawDBData: dbReport
    };
  }

  async fetchReports() {
    try {
      const dbReports = await this.reportService.getReports();
      this.allAlerts = dbReports.map(r => this.mapReportFromDB(r));
    } catch (error) {
      console.error('Error fetching reports:', error);
      this.allAlerts = [];
    }
    this.aplicarFiltros();
    if (this.initialOpenAlertId) {
      this.openAlertById(this.initialOpenAlertId);
      this.initialOpenAlertId = null;
    }
  }

  private openAlertById(id: string) {
    if (this.allAlerts.length === 0) {
      this.initialOpenAlertId = id;
    } else {
      const target = this.allAlerts.find(a => a.id === id);
      if (target) {
        // Limpiamos los filtros para que aparezca si estaba oculto
        this.filterDesde = '';
        this.filterHasta = '';
        this.filterOrigen = 'Todos';
        this.filterTipo = 'Todos';
        this.aplicarFiltros();

        // Mostramos el detalle
        setTimeout(() => this.mostrarDetalles(target), 100);

        // Limpiamos la URL
        this.router.navigate([], { queryParams: { alertId: null }, queryParamsHandling: 'merge' });
      }
    }
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
    // Destroy Flatpickr instances
    if (this.datePickerDesde) {
      this.datePickerDesde.destroy();
    }
    if (this.datePickerHasta) {
      this.datePickerHasta.destroy();
    }
    if (this.querySub) {
      this.querySub.unsubscribe();
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

  // --- Filter Dropdowns ---
  public toggleTipoDropdown(): void {
    this.isTipoDropdownOpen = !this.isTipoDropdownOpen;
  }

  public selectTipo(tipo: string): void {
    this.filterTipo = tipo;
    this.isTipoDropdownOpen = false;
    this.aplicarFiltros();
  }

  // --- Modal Dropdowns ---
  public toggleModalStatusDropdown(): void {
    this.isModalStatusDropdownOpen = !this.isModalStatusDropdownOpen;
  }

  public selectModalStatus(status: string): void {
    this.selectedStatus = status;
    this.isModalStatusDropdownOpen = false;
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

      const reverseStatusMap: { [key: string]: number } = {
        'Pendiente': 1,
        'En proceso': 2,
        'Completado': 3,
        'Cancelado': 31,
        'Suspendido': 32
      };

      try {
        await this.reportService.updateReport(this.alertToModify.id, { status_id: reverseStatusMap[this.selectedStatus] });

        // Update local arrays for both 'allAlerts' and 'displayedAlerts'
        const allIndex = this.allAlerts.findIndex(a => a.id === this.alertToModify.id);
        if (allIndex !== -1) {
          this.allAlerts[allIndex].estado = this.selectedStatus;
        }

        this.aplicarFiltros();
      } catch (error) {
        console.error('Error updating report status:', error);
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

      // Apply status filter
      if (this.filterEstado !== 'Todos' && alerta.estado?.toUpperCase() !== this.filterEstado.toUpperCase()) return false;

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
    this.filterEstado = 'Todos';
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