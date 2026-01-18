import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css' // Note: styleUrl is correct for newer Angular, but stylesUrl is standard. Leaving as is if original was like this.
})
export class MapaComponent implements OnInit {

  private map: any;
  private adminMarker: any;
  private guardMarkers: Map<string, any> = new Map(); // Map guard ID to marker

  // UI State
  public isEditingAdmin: boolean = false;
  public searchId: string = '';
  public selectedGuard: any = null;
  public isPickingLocation: boolean = false;

  public guards: any[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
      this.loadGuards();
    }
  }

  private loadGuards() {
    this.http.get<any[]>('http://localhost:3000/api/guards').subscribe({
      next: (data) => {
        this.guards = data;
        this.refreshGuardMarkers();
      },
      error: (err) => console.error('Error loading guards', err)
    });
  }

  private async initMap(): Promise<void> {
    const L = await import('leaflet');

    // Default location (e.g., Mexico City or user location)
    let lat = 19.4326;
    let lng = -99.1332;
    let zoom = 12;

    // Check for user location
    const user = this.authService.getCurrentUser();
    if (user && user.lat && user.lng) {
      lat = parseFloat(user.lat);
      lng = parseFloat(user.lng);
      zoom = 15;
    }

    this.map = L.map('map', {
      center: [lat, lng],
      zoom: zoom
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 3,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // Admin Marker
    this.createAdminMarker(L, lat, lng, user);

    // Map Click Handler for Guard Assignment
    this.map.on('click', (e: any) => {
      if (this.isPickingLocation && this.selectedGuard) {
        this.assignGuardLocation(e.latlng.lat, e.latlng.lng);
      }
    });
  }

  private createAdminMarker(L: any, lat: number, lng: number, user: any) {
    const icon = L.icon({
      iconUrl: 'assets/marker-icon.png', // Default leaflet marker
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    // Fix for missing assets in some builds, but let's assume standard leaflet setup or use a colored one
    // For admin, maybe blue.

    this.adminMarker = L.marker([lat, lng], { draggable: this.isEditingAdmin }).addTo(this.map);

    if (user) {
      this.adminMarker.bindPopup(`<b>Administrador: ${user.fullName || user.name}</b><br>${user.companyName || 'Sin Compañía'}`).openPopup();
    }

    this.adminMarker.on('dragend', () => {
      // Optional: Auto-save on drag end if needed, or wait for button
    });
  }

  private async refreshGuardMarkers() {
    if (!this.map) return;
    const L = await import('leaflet');

    // Clear existing guard markers
    this.guardMarkers.forEach(marker => this.map.removeLayer(marker));
    this.guardMarkers.clear();

    // Add markers for guards with location
    this.guards.forEach(guard => {
      if (guard.lat && guard.lng) {
        const marker = L.marker([guard.lat, guard.lng], {
          icon: this.getGuardIcon(L, guard.estado)
        }).addTo(this.map);

        marker.bindPopup(`
          <div class="text-center">
            <h3 class="font-bold">${guard.nombre}</h3>
            <p class="text-xs text-gray-500">ID: ${guard.idEmpleado}</p>
            <p class="text-sm">${guard.area}</p>
            <span class="inline-block px-2 py-0.5 rounded text-xs text-white ${guard.estado === 'En servicio' ? 'bg-green-500' : 'bg-red-500'}">
              ${guard.estado}
            </span>
          </div>
        `);

        this.guardMarkers.set(guard.idEmpleado, marker);
      }
    });
  }

  private getGuardIcon(L: any, status: string) {
    // Simple colored marker logic or default
    // Using a filter to change hueTest could be complex, keeping default for now or using a custom divIcon
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${status === 'En servicio' ? '#22c55e' : '#ef4444'}; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  // --- Admin Location Logic ---

  public toggleAdminEdit() {
    this.isEditingAdmin = !this.isEditingAdmin;
    if (this.adminMarker) {
      if (this.isEditingAdmin) {
        this.adminMarker.dragging.enable();
      } else {
        this.adminMarker.dragging.disable();
        // Save new location
        const latLng = this.adminMarker.getLatLng();
        this.saveAdminLocation(latLng.lat, latLng.lng);
      }
    }
  }

  private saveAdminLocation(lat: number, lng: number) {
    // Update local user and user in storage
    const user = this.authService.getCurrentUser();
    if (user) {
      user.lat = lat;
      user.lng = lng;
      // Also reverse geocode if possible to update text location, but for now just updating coords
      localStorage.setItem('currentUser', JSON.stringify(user));
      alert('Ubicación del administrador actualizada.');
    }
  }

  // --- Guard Management Logic ---

  public searchGuard() {
    this.selectedGuard = this.guards.find(g => g.idEmpleado === this.searchId);
    if (!this.selectedGuard) {
      alert('Guardia no encontrado');
    }
  }

  public enableGuardLocationPick() {
    this.isPickingLocation = true;
  }

  public cancelPick() {
    this.isPickingLocation = false;
  }

  public assignGuardLocation(lat: number, lng: number) {
    if (!this.selectedGuard) return;

    this.selectedGuard.lat = lat;
    this.selectedGuard.lng = lng;

    this.updateGuard(this.selectedGuard).subscribe({
      next: () => {
        this.isPickingLocation = false;
        this.refreshGuardMarkers();
        alert(`Ubicación asignada a ${this.selectedGuard.nombre}`);
      },
      error: (err) => {
        console.error('Error updating guard', err);
        alert('Error al asignar ubicación');
      }
    });
  }

  public removeGuardLocation() {
    if (!this.selectedGuard) return;
    if (!confirm('¿Estás seguro de eliminar la ubicación de este guardia?')) return;

    this.selectedGuard.lat = null;
    this.selectedGuard.lng = null;

    this.updateGuard(this.selectedGuard).subscribe({
      next: () => {
        this.refreshGuardMarkers();
        alert('Ubicación eliminada');
      },
      error: (err) => alert('Error eliminando ubicación')
    });
  }

  private updateGuard(guard: any) {
    return this.http.patch(`http://localhost:3000/api/guards/${guard.idEmpleado}`, guard);
  }
}
