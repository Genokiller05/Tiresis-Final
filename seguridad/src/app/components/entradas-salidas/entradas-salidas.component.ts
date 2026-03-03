import { Component, OnInit, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import { ViewChild, ElementRef } from '@angular/core';

import { EntryExitService } from '../../services/entry-exit.service';
import { Subscription } from 'rxjs';

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
  @ViewChild('filterDesdeInput') filterDesdeInput!: ElementRef;
  @ViewChild('filterHastaInput') filterHastaInput!: ElementRef;
  private datePickerDesde: any;
  private datePickerHasta: any;

  // Modal States
  public isDeleteModalVisible: boolean = false;
  public isModifyModalVisible: boolean = false;
  public isDetailsModalVisible: boolean = false;

  // Selected Records
  public selectedRegistro: any = null;
  public registroToModify: any = null;

  // Dropdown States
  public isTipoDropdownOpen: boolean = false;
  public isAccionDropdownOpen: boolean = false;
  public isModalTipoDropdownOpen: boolean = false;
  public isModalAccionDropdownOpen: boolean = false;

  private realtimeSubscription!: Subscription;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private entryExitService: EntryExitService
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarDatos();

      this.realtimeSubscription = this.entryExitService.getEntriesUpdates().subscribe(payload => {
        this.handleRealtimeEvent(payload);
      });
    }
  }

  private handleRealtimeEvent(payload: any) {
    if (payload.eventType === 'INSERT') {
      const mappedNew = this.mapEntryFromDB(payload.new);
      const exists = this.registros.find(r => r.id === mappedNew.id);
      if (!exists) {
        this.registros.unshift(mappedNew);
      }
    } else if (payload.eventType === 'UPDATE') {
      const mappedUpdate = this.mapEntryFromDB(payload.new);
      const index = this.registros.findIndex(r => r.id === mappedUpdate.id);
      if (index !== -1) {
        this.registros[index] = mappedUpdate;
      }
    } else if (payload.eventType === 'DELETE') {
      this.registros = this.registros.filter(r => r.id !== payload.old.id);
    }
    this.filtrar();
  }

  async cargarDatos() {
    try {
      const dbData = await this.entryExitService.getEntriesExits();
      this.registros = dbData.map(r => this.mapEntryFromDB(r));
      this.filtrar(); // Re-apply filters after loading
    } catch (error) {
      console.error('Error cargando registros:', error);
    }
  }

  private mapEntryFromDB(entry: any): any {
    let nombreStr = 'Identidad Protegida';
    let destinoStr = 'Sin especificar';
    let tipoPerfil = 'Residente'; // Valor por defecto
    let evidenciaSrc = null;
    let descripcionLimpia = entry.descripcion || '';

    // Intentamos parsear la descripción que guarda la app móvil ("Nombre: XXX. Visita a: YYY")
    if (entry.descripcion) {
      let tempDesc = entry.descripcion;
      const evMatch = tempDesc.match(/Evidencia: (http[s]?:\/\/[^\s]+)/);
      if (evMatch && evMatch[1]) {
        evidenciaSrc = evMatch[1];
        tempDesc = tempDesc.replace(evMatch[0], '').replace(/\|\s*$/, '').trim();
      }

      descripcionLimpia = tempDesc;

      if (tempDesc.includes('Nombre:')) {
        const parts = tempDesc.split('.');
        nombreStr = parts[0].replace('Nombre:', '').trim();
        if (parts.length > 1) {
          destinoStr = parts.slice(1).join('.').trim();
        }
      } else {
        nombreStr = tempDesc.substring(0, 30);
        destinoStr = tempDesc;
      }
    }

    // Inferimos la categoría (filtro tipo dropdown) para 'Residente', 'Personal', 'Paquetería'
    if (entry.categoria === 'package' || (entry.descripcion && entry.descripcion.includes('Paquete'))) {
      tipoPerfil = 'Paquetería';
    } else if (entry.categoria === 'service' || (entry.descripcion && entry.descripcion.includes('Trabajador'))) {
      tipoPerfil = 'Personal';
    } else {
      tipoPerfil = 'Residente';
    }

    return {
      id: entry.id,
      fechaHora: entry.created_at || entry.fechaHora,
      fecha: entry.created_at || entry.fechaHora, // Atributo que usa el HTML date pipe
      accion: entry.tipo || 'Entrada', // La BD guarda 'Entrada' o 'Salida' en la columna 'tipo'
      tipo: tipoPerfil, // Esto corresponde a tu filtro ('Residente', 'Personal', etc.)
      nombre: nombreStr,
      destino: destinoStr,
      detalles: {
        notes: descripcionLimpia,
        evidence_url: evidenciaSrc
      },
      _rawDBData: entry
    };
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initFlatpickr();
    }
  }

  private initFlatpickr() {
    console.log('Inicializando Flatpickr...');
    const config: any = {
      enableTime: false,
      dateFormat: "Y-m-d",
      locale: Spanish,
      allowInput: true,
      disableMobile: true,
      static: true, // Ayuda con el posicionamiento en contenedores con scrolling
    };

    if (this.filterDesdeInput) {
      this.datePickerDesde = (flatpickr as any).default(this.filterDesdeInput.nativeElement, {
        ...config,
        defaultDate: this.filtroDesde,
        onChange: (selectedDates: any, dateStr: string) => {
          this.filtroDesde = dateStr;
          this.filtrar();
        }
      });
      console.log('DatePicker Desde inicializado');
    }

    if (this.filterHastaInput) {
      this.datePickerHasta = (flatpickr as any).default(this.filterHastaInput.nativeElement, {
        ...config,
        defaultDate: this.filtroHasta,
        onChange: (selectedDates: any, dateStr: string) => {
          this.filtroHasta = dateStr;
          this.filtrar();
        }
      });
      console.log('DatePicker Hasta inicializado');
    }
  }

  ngOnDestroy(): void {
    if (this.datePickerDesde) {
      this.datePickerDesde.destroy();
    }
    if (this.datePickerHasta) {
      this.datePickerHasta.destroy();
    }
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
  }

  // cargarDatosPrueba removed


  filtrar(): void {
    this.registrosFiltrados = this.registros.filter(registro => {
      // Filtro de Fechas
      const fechaRegistro = new Date(registro.fechaHora);
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

  // --- Filter Dropdowns ---
  toggleTipoDropdown(): void {
    this.isTipoDropdownOpen = !this.isTipoDropdownOpen;
    this.isAccionDropdownOpen = false;
  }

  selectTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.isTipoDropdownOpen = false;
    this.filtrar();
  }

  toggleAccionDropdown(): void {
    this.isAccionDropdownOpen = !this.isAccionDropdownOpen;
    this.isTipoDropdownOpen = false;
  }

  selectAccion(accion: string): void {
    this.filtroAccion = accion;
    this.isAccionDropdownOpen = false;
    this.filtrar();
  }

  // --- Modal Dropdowns ---
  toggleModalTipoDropdown(): void {
    this.isModalTipoDropdownOpen = !this.isModalTipoDropdownOpen;
    this.isModalAccionDropdownOpen = false;
  }

  selectModalTipo(tipo: string): void {
    if (this.registroToModify) {
      this.registroToModify.tipo = tipo;
    }
    this.isModalTipoDropdownOpen = false;
  }

  toggleModalAccionDropdown(): void {
    this.isModalAccionDropdownOpen = !this.isModalAccionDropdownOpen;
    this.isModalTipoDropdownOpen = false;
  }

  selectModalAccion(accion: string): void {
    if (this.registroToModify) {
      this.registroToModify.accion = accion;
    }
    this.isModalAccionDropdownOpen = false;
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

  async confirmEdit() {
    if (this.selectedRegistro && this.registroToModify) {
      try {
        await this.entryExitService.updateEntryExit(this.selectedRegistro.id, this.registroToModify);

        // Update original object properties locally to reflect changes immediately
        Object.assign(this.selectedRegistro, this.registroToModify);

        this.filtrar();
      } catch (error) {
        console.error('Error actualizando registro:', error);
      }
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

  async confirmDelete() {
    if (this.selectedRegistro) {
      try {
        await this.entryExitService.deleteEntryExit(this.selectedRegistro.id);
        this.registros = this.registros.filter(r => r.id !== this.selectedRegistro.id);
        this.filtrar();
      } catch (error) {
        console.error('Error eliminando registro:', error);
      }
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
