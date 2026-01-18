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

  constructor() { }

  ngOnInit(): void {
  }

  registrar(): void {
    console.log('Implementar lógica de registro');
    // Aquí podrías abrir un modal o navegar a un formulario
    alert('Funcionalidad de registro en construcción');
  }

  buscar(): void {
    console.log('Buscando registros...');
    // Aquí implementarías la lógica de filtrado real
  }

}
