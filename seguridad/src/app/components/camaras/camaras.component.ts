import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Camera {
  id: string;
  ip: string;
  marca: string;
  modelo: string;
  activa: boolean;
  area: string;
  alertas: number;
}

@Component({
  selector: 'app-camaras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './camaras.component.html',
  styleUrl: './camaras.component.css' // Assuming original file was camaras.css or similar
})
export class CamarasComponent implements OnInit {

  public cameras: Camera[] = [];
  public selectedCamera: Camera | null = null;

  // Modal States
  public isDetailsModalVisible: boolean = false;
  public isDeleteModalVisible: boolean = false;

  // Edit Form Buffer
  public editForm: any = {};

  // Menu Dropdown
  public activeMenuId: string | null = null;

  constructor() { }

  ngOnInit(): void {
    this.cargarDatosPrueba();
  }

  cargarDatosPrueba() {
    this.cameras = [
      { id: 'CAM-001', ip: '192.168.1.101', marca: 'Hikvision', modelo: 'DS-2CD2043G0-I', activa: true, area: 'Entrada Principal', alertas: 2 },
      { id: 'CAM-002', ip: '192.168.1.102', marca: 'Dahua', modelo: 'IPC-HFW2431S-S', activa: true, area: 'Estacionamiento', alertas: 0 },
      { id: 'CAM-003', ip: '192.168.1.103', marca: 'Axis', modelo: 'M1135-E', activa: false, area: 'Pasillo Central', alertas: 5 }
    ];
  }

  // --- Menu Toggle ---
  toggleMenu(id: string) {
    if (this.activeMenuId === id) {
      this.activeMenuId = null;
    } else {
      this.activeMenuId = id;
    }
  }

  closeMenu() {
    this.activeMenuId = null;
  }

  // --- Actions ---
  toggleStatus(camera: Camera) {
    camera.activa = !camera.activa;
    this.closeMenu();
  }

  showDetails(camera: Camera) {
    this.selectedCamera = camera;
    this.editForm = { ...camera }; // Copy for editing
    this.isDetailsModalVisible = true;
    this.closeMenu();
  }

  hideDetailsModal() {
    this.isDetailsModalVisible = false;
    this.selectedCamera = null;
  }

  saveDetails() {
    if (!this.selectedCamera) return;

    // Update local object
    this.selectedCamera.marca = this.editForm.marca;
    this.selectedCamera.modelo = this.editForm.modelo;
    this.selectedCamera.area = this.editForm.area;

    // In a real app, you would call a service here

    this.hideDetailsModal();
  }

  requestDelete(camera: Camera) {
    this.selectedCamera = camera;
    this.isDeleteModalVisible = true;
    this.closeMenu();
  }

  hideDeleteModal() {
    this.isDeleteModalVisible = false;
    this.selectedCamera = null;
  }

  confirmDelete() {
    if (!this.selectedCamera) return;

    this.cameras = this.cameras.filter(c => c.id !== this.selectedCamera!.id);
    this.hideDeleteModal();
  }
}
