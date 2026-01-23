import { Component, OnInit, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';

@Component({
  selector: 'app-entradas-salidas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entradas-salidas.component.html',
  styleUrls: ['./entradas-salidas.component.css']
})
export class EntradasSalidasComponent implements OnInit, OnDestroy, AfterViewInit {

  public registros: any[] = [];
  public registrosFiltrados: any[] = [];

  // Filtros
  public filtroDesde: string = '';
  public filtroHasta: string = '';
  public filtroTipo: string = 'Todos'; // Residente, Personal, Paquetería
  public filtroAccion: string = 'Todos'; // Entrada, Salida

  // Flatpickr instances
  private datePickerDesde: any;
  private datePickerHasta: any;

  // Modal States
  public isDeleteModalVisible: boolean = false;
  public isModifyModalVisible: boolean = false;
  public isDetailsModalVisible: boolean = false;

  // Selected Records
  public selectedRegistro: any = null;
  public registroToModify: any = null; // For the form

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    this.cargarDatosPrueba();
    this.filtrar();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initFlatpickr();
    }
  }

  private initFlatpickr() {
    const config = {
      enableTime: false, // Usually just date for filters, but can be true if needed
      dateFormat: "Y-m-d",
      locale: Spanish,
      altInput: true,
      altFormat: "d/m/Y",
      allowInput: true
    };

    const desdeInput = document.getElementById('filterDesde');
    const hastaInput = document.getElementById('filterHasta');

    if (desdeInput) {
      this.datePickerDesde = flatpickr(desdeInput, {
        ...config,
        defaultDate: this.filtroDesde,
        onChange: (selectedDates, dateStr) => {
          this.filtroDesde = dateStr;
          this.filtrar();
        }
      });
    }

    if (hastaInput) {
      this.datePickerHasta = flatpickr(hastaInput, {
        ...config,
        defaultDate: this.filtroHasta,
        onChange: (selectedDates, dateStr) => {
          this.filtroHasta = dateStr;
          this.filtrar();
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.datePickerDesde) {
      this.datePickerDesde.destroy();
    }
    if (this.datePickerHasta) {
      this.datePickerHasta.destroy();
    }
  }

  cargarDatosPrueba() {
    this.registros = [
      // 3 Residentes
      { id: 1, nombre: 'Juan Pérez', tipo: 'Residente', accion: 'Entrada', fecha: '2025-01-18T10:30', destino: 'Apto 101' },
      { id: 2, nombre: 'Ana López', tipo: 'Residente', accion: 'Salida', fecha: '2025-01-18T08:15', destino: 'Gimnasio' },
      { id: 3, nombre: 'Carlos Ruiz', tipo: 'Residente', accion: 'Entrada', fecha: '2025-01-17T19:00', destino: 'Apto 205' },

      // 3 Personal
      { id: 4, nombre: 'María González', tipo: 'Personal', accion: 'Entrada', fecha: '2025-01-18T07:00', destino: 'Limpieza' },
      { id: 5, nombre: 'Pedro Ramírez', tipo: 'Personal', accion: 'Salida', fecha: '2025-01-18T16:00', destino: 'Mantenimiento' },
      { id: 6, nombre: 'Luisa Fernández', tipo: 'Personal', accion: 'Entrada', fecha: '2025-01-18T09:00', destino: 'Administración' },

      // 3 Paquetería
      { id: 7, nombre: 'Amazon Delivery', tipo: 'Paquetería', accion: 'Entrada', fecha: '2025-01-18T11:45', destino: 'Recepción' },
      { id: 8, nombre: 'DHL Express', tipo: 'Paquetería', accion: 'Salida', fecha: '2025-01-18T12:00', destino: 'Salida General' },
      { id: 9, nombre: 'FedEx', tipo: 'Paquetería', accion: 'Entrada', fecha: '2025-01-17T15:30', destino: 'Apto 302' },
    ];
  }

  filtrar(): void {
    this.registrosFiltrados = this.registros.filter(registro => {
      // Filtro de Fechas
      const fechaRegistro = new Date(registro.fecha);
      if (this.filtroDesde) {
        const desde = new Date(this.filtroDesde);
        // Start of day
        desde.setHours(0, 0, 0, 0);
        if (fechaRegistro < desde) return false;
      }
      if (this.filtroHasta) {
        const hasta = new Date(this.filtroHasta);
        // End of day
        hasta.setHours(23, 59, 59, 999);
        if (fechaRegistro > hasta) return false;
      }

      // Filtro Tipo (Residente, Personal, Paquetería)
      if (this.filtroTipo !== 'Todos' && registro.tipo !== this.filtroTipo) {
        return false;
      }

      // Filtro Acción (Entrada, Salida)
      if (this.filtroAccion !== 'Todos' && registro.accion !== this.filtroAccion) {
        return false;
      }

      return true;
    });
  }

  // --- Actions Menu ---
  toggleMenu(registro: any): void {
    // Close others
    this.registrosFiltrados.forEach(r => {
      if (r !== registro) r.menuVisible = false;
    });
    registro.menuVisible = !registro.menuVisible;
  }

  // --- Details Modal ---
  showDetails(registro: any): void {
    this.selectedRegistro = registro;
    this.isDetailsModalVisible = true;
    registro.menuVisible = false;
  }

  closeDetailsModal(): void {
    this.isDetailsModalVisible = false;
    this.selectedRegistro = null;
  }

  // --- Modify Modal ---
  prepareEdit(registro: any): void {
    this.selectedRegistro = registro;
    // Clone to avoid direct mutation before save
    this.registroToModify = { ...registro };
    this.isModifyModalVisible = true;
    registro.menuVisible = false;
  }

  confirmEdit(): void {
    if (this.selectedRegistro && this.registroToModify) {
      // Update original object properties
      Object.assign(this.selectedRegistro, this.registroToModify);

      // Refresh filter in case filtered properties changed
      // (Though in a real app coupled with backend, we might reload data)
      this.filtrar();
    }
    this.closeModifyModal();
  }

  closeModifyModal(): void {
    this.isModifyModalVisible = false;
    this.selectedRegistro = null;
    this.registroToModify = null;
  }

  // --- Delete Modal ---
  prepareDelete(registro: any): void {
    this.selectedRegistro = registro;
    this.isDeleteModalVisible = true;
    registro.menuVisible = false;
  }

  confirmDelete(): void {
    if (this.selectedRegistro) {
      this.registros = this.registros.filter(r => r.id !== this.selectedRegistro.id);
      this.filtrar();
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.isDeleteModalVisible = false;
    this.selectedRegistro = null;
  }

  registrar(): void {
    // Implementar futura lógica
  }
}
