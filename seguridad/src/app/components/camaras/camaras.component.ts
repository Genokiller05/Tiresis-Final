import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CameraService } from '../../services/camera.service';

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

  constructor(private cameraService: CameraService) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos() {
    try {
      this.cameras = await this.cameraService.getCameras();
    } catch (error) {
      console.error('Error cargando cámaras:', error);
    }
  }

  // Registration Modal
  public isRegisterModalVisible: boolean = false;
  public newCamera: any = {
    ip: '',
    marca: '',
    modelo: '',
    area: ''
  };

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

  // --- Registration Methods ---
  showRegisterModal() {
    this.newCamera = { ip: '', marca: '', modelo: '', area: '' };
    this.isRegisterModalVisible = true;
  }

  hideRegisterModal() {
    this.isRegisterModalVisible = false;
  }

  async registerCamera() {
    // Basic validation
    if (!this.newCamera.ip || !this.newCamera.marca || !this.newCamera.modelo || !this.newCamera.area) {
      alert('Por favor complete todos los campos');
      return;
    }

    // Auto-generate ID
    const nextId = this.generateNextId();


    const cameraToAdd: Camera = {
      id: nextId,
      ip: this.newCamera.ip,
      marca: this.newCamera.marca,
      modelo: this.newCamera.modelo,
      area: this.newCamera.area,
      activa: true, // Default to active
      alertas: 0
    };

    try {
      await this.cameraService.createCamera(cameraToAdd);
      this.cameras.push(cameraToAdd); // Optimistic update or reload
      this.hideRegisterModal();
    } catch (error) {
      console.error('Error creando cámara:', error);
      alert('Error al crear la cámara');
    }
  }

  private generateNextId(): string {
    if (this.cameras.length === 0) return 'CAM-001';

    // Extract numbers from IDs (e.g., "CAM-003" -> 3)
    const numbers = this.cameras.map(c => {
      const parts = c.id.split('-');
      return parseInt(parts[1], 10);
    });

    const maxId = Math.max(...numbers);
    const nextNum = maxId + 1;

    // Pad with zeros (e.g., 4 -> "004")
    const paddedNum = nextNum.toString().padStart(3, '0');
    return `CAM-${paddedNum}`;
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

  async saveDetails() {
    if (!this.selectedCamera) return;


    // Update local object
    const updates = {
      marca: this.editForm.marca,
      modelo: this.editForm.modelo,
      area: this.editForm.area
    };

    try {
      await this.cameraService.updateCamera(this.selectedCamera.id, updates);

      // Update local state
      this.selectedCamera.marca = updates.marca;
      this.selectedCamera.modelo = updates.modelo;
      this.selectedCamera.area = updates.area;

      this.hideDetailsModal();
    } catch (error) {
      console.error('Error actualizando cámara:', error);
      alert('Error al actualizar la cámara');
    }
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

  async confirmDelete() {
    if (!this.selectedCamera) return;

    try {
      await this.cameraService.deleteCamera(this.selectedCamera.id);
      this.cameras = this.cameras.filter(c => c.id !== this.selectedCamera!.id);
      this.hideDeleteModal();
    } catch (error) {
      console.error('Error eliminando cámara:', error);
      alert('Error al eliminar la cámara');
    }
  }
}
