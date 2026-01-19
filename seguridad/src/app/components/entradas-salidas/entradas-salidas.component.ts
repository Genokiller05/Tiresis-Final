import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-entradas-salidas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entradas-salidas.component.html',
  styleUrls: ['./entradas-salidas.component.css']
})
export class EntradasSalidasComponent implements OnInit {

  public registros: any[] = [];
  public registrosFiltrados: any[] = [];

  // Filtros
  public filtroDesde: string = '';
  public filtroHasta: string = '';
  public filtroTipo: string = 'Todos'; // Residente, Personal, Paquetería
  public filtroAccion: string = 'Todos'; // Entrada, Salida

  constructor() { }

  ngOnInit(): void {
    this.cargarDatosPrueba();
    this.filtrar();
  }

  cargarDatosPrueba() {
    this.registros = [
      // 3 Residentes
      { nombre: 'Juan Pérez', tipo: 'Residente', accion: 'Entrada', fecha: '2025-01-18T10:30', destino: 'Apto 101' },
      { nombre: 'Ana López', tipo: 'Residente', accion: 'Salida', fecha: '2025-01-18T08:15', destino: 'Gimnasio' },
      { nombre: 'Carlos Ruiz', tipo: 'Residente', accion: 'Entrada', fecha: '2025-01-17T19:00', destino: 'Apto 205' },

      // 3 Personal
      { nombre: 'María González', tipo: 'Personal', accion: 'Entrada', fecha: '2025-01-18T07:00', destino: 'Limpieza' },
      { nombre: 'Pedro Ramírez', tipo: 'Personal', accion: 'Salida', fecha: '2025-01-18T16:00', destino: 'Mantenimiento' },
      { nombre: 'Luisa Fernández', tipo: 'Personal', accion: 'Entrada', fecha: '2025-01-18T09:00', destino: 'Administración' },

      // 3 Paquetería
      { nombre: 'Amazon Delivery', tipo: 'Paquetería', accion: 'Entrada', fecha: '2025-01-18T11:45', destino: 'Recepción' },
      { nombre: 'DHL Express', tipo: 'Paquetería', accion: 'Salida', fecha: '2025-01-18T12:00', destino: 'Salida General' },
      { nombre: 'FedEx', tipo: 'Paquetería', accion: 'Entrada', fecha: '2025-01-17T15:30', destino: 'Apto 302' },
    ];
  }

  filtrar(): void {
    this.registrosFiltrados = this.registros.filter(registro => {
      // Filtro de Fechas
      const fechaRegistro = new Date(registro.fecha);
      if (this.filtroDesde) {
        const desde = new Date(this.filtroDesde);
        if (fechaRegistro < desde) return false;
      }
      if (this.filtroHasta) {
        const hasta = new Date(this.filtroHasta);
        // Ajustar hasta el final del día
        hasta.setHours(23, 59, 59);
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

  registrar(): void {
    // Implementar futura lógica
  }
}
