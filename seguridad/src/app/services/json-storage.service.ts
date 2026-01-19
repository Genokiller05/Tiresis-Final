import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class JsonStorageService {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  getData(key: string): any {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  setData(key: string, data: any): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  removeData(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    }
  }

  // Datos de ejemplo para simular la base de datos
  private defaultAlerts = [
    {
      id: '1',
      fechaHora: new Date('2026-01-15T10:00:00').toISOString(),
      origen: 'IA',
      tipo: 'Movimiento Sospechoso',
      sitioArea: 'Entrada principal',
      estado: 'Pendiente',
      detalles: {
        camara: { numero: 1, id: 'cam001', ip: '192.168.1.100' },
        descripcion: 'Detectado movimiento inusual cerca de la puerta principal.'
      }
    },
    {
      id: '2',
      fechaHora: new Date('2026-01-15T11:30:00').toISOString(),
      origen: 'Guardia',
      tipo: 'Acceso No Autorizado',
      sitioArea: 'Edificio B',
      estado: 'En proceso',
      detalles: {
        nombreGuardia: 'Carlos Ruiz',
        idGuardia: 'GRD001',
        descripcion: 'Persona intentando forzar entrada a Edificio B.'
      }
    },
    {
      id: '3',
      fechaHora: new Date('2026-01-14T20:00:00').toISOString(),
      origen: 'IA',
      tipo: 'Vehículo Estacionado',
      sitioArea: 'Estacionamiento',
      estado: 'Completado',
      detalles: {
        camara: { numero: 3, id: 'cam003', ip: '192.168.1.102' },
        descripcion: 'Vehículo permaneció estacionado más de 2 horas en zona prohibida. Reporte cerrado.'
      }
    }
  ];

  private defaultGuards = [
    {
      id: 'GRD001',
      nombre: 'Carlos Ruiz',
      email: 'carlos.ruiz@example.com',
      area: 'Entrada principal',
      estado: 'En servicio',
      foto: 'assets/images/guards/photo-1763960150937-934587064.png',
      actividades: [
        { fechaHora: new Date('2026-01-15T09:00:00').toISOString(), descripcion: 'Inicio de turno' },
        { fechaHora: new Date('2026-01-15T11:30:00').toISOString(), descripcion: 'Reporte de acceso no autorizado en Edificio B' }
      ]
    },
    {
      id: 'GRD002',
      nombre: 'Ana García',
      email: 'ana.garcia@example.com',
      area: 'Edificio A',
      estado: 'Fuera de servicio',
      foto: 'assets/images/guards/photo-1764540345535-321072179.png',
      actividades: [
        { fechaHora: new Date('2026-01-14T08:00:00').toISOString(), descripcion: 'Inicio de turno' },
        { fechaHora: new Date('2026-01-14T17:00:00').toISOString(), descripcion: 'Fin de turno' }
      ]
    }
  ];

  private defaultEntriesExits = [
    {
      id: 'EE001',
      persona: 'Maria López',
      tipoPersona: 'Residente',
      tipoMovimiento: 'Entrada',
      fechaHora: new Date('2026-01-16T08:15:00').toISOString(),
      destinoOrigen: 'Apartamento 203'
    },
    {
      id: 'EE002',
      persona: 'Pedro Sánchez',
      tipoPersona: 'Personal',
      tipoMovimiento: 'Salida',
      fechaHora: new Date('2026-01-16T17:00:00').toISOString(),
      destinoOrigen: 'Trabajo'
    },
    {
      id: 'EE003',
      persona: 'Laura Giménez',
      tipoPersona: 'Visita',
      tipoMovimiento: 'Entrada',
      fechaHora: new Date('2026-01-16T10:45:00').toISOString(),
      destinoOrigen: 'Apartamento 101'
    }
  ];

  // Método para inicializar los datos en localStorage si no existen
  initDefaultData(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Cargar guardias desde el archivo JSON de forma síncrona usando fetch
      if (!this.getData('guards')) {
        try {
          fetch('http://localhost:3000/api/guards')
            .then(response => response.json())
            .then(guardData => {
              this.setData('guards', guardData);
            })
            .catch(err => {
              console.error('Error cargando guards from API:', err);
              // Si falla, usar los datos por defecto
              this.setData('guards', this.defaultGuards);
            });
        } catch (err) {
          console.error('Error:', err);
          this.setData('guards', this.defaultGuards);
        }
      }
      if (!this.getData('alerts')) {
        this.setData('alerts', this.defaultAlerts);
      }
      if (!this.getData('entriesExits')) {
        this.setData('entriesExits', this.defaultEntriesExits);
      }
    }
  }
}