import { Component, OnInit, Inject, PLATFORM_ID, NgZone } from '@angular/core';
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
  private L: any; // Cache Leaflet instance

  // UI State
  public isEditingAdmin: boolean = false;
  public searchId: string = '';
  public selectedGuard: any = null;
  public isPickingLocation: boolean = false;

  public feedbackMessage: string = '';
  public feedbackType: 'success' | 'error' = 'success';
  public guards: any[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private http: HttpClient,
    private ngZone: NgZone
  ) { }

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      await this.initMap();
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
    this.L = await import('leaflet');
    const L = this.L;

    // Default location
    let lat = 19.4326;
    let lng = -99.1332;
    let zoom = 12;

    // Helper to initialize map once coordinates are settled
    const createMap = (latitude: number, longitude: number, z: number, user: any) => {
      this.map = L.map('map', {
        center: [latitude, longitude],
        zoom: z,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 3,
      }).addTo(this.map);

      // this.map.attributionControl.setPrefix(''); // Removed to prevent crash when attributionControl is false

      // Admin Marker
      this.createAdminMarker(L, latitude, longitude, user);

      // Map Click Handler
      this.map.on('click', (e: any) => {
        this.ngZone.run(() => {
          if (this.isPickingLocation && this.selectedGuard) {
            this.assignGuardLocation(e.latlng.lat, e.latlng.lng);
          }
          if (this.isEditingAdmin && this.adminMarker) {
            this.adminMarker.setLatLng(e.latlng);
          }
        });
      });

      // Update cursor class
      // Note: We use a simple watcher in ngDoCheck or similar if we wanted to be reactive perfectly, 
      // but simpler is to toggle it in enable/disable methods OR bind it in HTML (would require viewChild).
      // Since map div is not separate component, let's just use the simpler approach: binding class unavailable on ID, 
      // so we might need to do it via ViewChild or simple document query if strict angular way is too verbose.
      // Better way: use [class.picking-mode]="isPickingLocation" on a wrapper div in HTML if possible.
      // Looking at HTML, #map is a div. We can add [class.cursor-crosshair]="isPickingLocation" in HTML.


      // Force refresh guards
      if (this.guards.length > 0) {
        this.refreshGuardMarkers();
      }
    };

    // Check for user location - Fetch fresh from API
    const localUser = this.authService.getCurrentUser();
    if (localUser && localUser.email) {
      this.http.get<any>(`http://localhost:3000/api/admins/${localUser.email}`).subscribe({
        next: (adminData) => {
          if (adminData.lat && adminData.lng) {
            lat = parseFloat(adminData.lat);
            lng = parseFloat(adminData.lng);
            zoom = 15;
          }
          createMap(lat, lng, zoom, adminData);
        },
        error: () => {
          createMap(lat, lng, zoom, localUser);
        }
      });
    } else {
      createMap(lat, lng, zoom, null);
    }
  }

  private createAdminMarker(L: any, lat: number, lng: number, user: any) {
    const adminIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #9333ea; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.adminMarker = L.marker([lat, lng], {
      icon: adminIcon,
      draggable: this.isEditingAdmin
    }).addTo(this.map);

    if (user) {
      this.adminMarker.bindPopup(`<b>Administrador: ${user.fullName || user.name}</b><br>${user.companyName || 'Sin Compañía'}`);
      // Open popup only if not editing to avoid obstruction
      if (!this.isEditingAdmin) this.adminMarker.openPopup();
    }

    this.adminMarker.on('dragend', () => {
      // Position updated automatically, save happens on button click
    });
  }

  private async refreshGuardMarkers() {
    if (!this.map) return;
    const L = this.L || await import('leaflet');

    // Clear existing guard markers
    this.guardMarkers.forEach(marker => this.map.removeLayer(marker));
    this.guardMarkers.clear();

    // Add markers for guards with location
    this.guards.forEach(guard => {
      if (guard.lat && guard.lng) {
        const lat = parseFloat(guard.lat);
        const lng = parseFloat(guard.lng);

        const marker = L.marker([lat, lng], {
          icon: this.getGuardIcon(L, guard.estado)
        }).addTo(this.map);

        marker.bindTooltip(`
          <div class="text-center">
            <h3 class="font-bold whitespace-nowrap">${guard.nombre}</h3>
            <p class="text-xs text-gray-500">${guard.area}</p>
          </div>
        `, {
          permanent: false,
          direction: 'top',
          className: 'custom-tooltip'
        });

        // Click to select this guard as active selection
        marker.on('click', () => {
          this.searchId = guard.idEmpleado;
          this.searchGuard();
        });


        this.guardMarkers.set(guard.idEmpleado, marker);
      }
    });
  }

  private getGuardIcon(L: any, status: string) {
    // Simple colored marker logic or default
    // Using a filter to change hueTest could be complex, keeping default for now or using a custom divIcon
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${status === 'En servicio' ? '#22c55e' : '#6b7280'}; width: 1.25rem; height: 1.25rem; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
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
    const user = this.authService.getCurrentUser();
    if (user) {
      user.lat = lat;
      user.lng = lng;

      // Save locally
      localStorage.setItem('currentUser', JSON.stringify(user));

      // Save to backend
      this.http.patch('http://localhost:3000/api/admins/update', {
        email: user.email,
        lat: lat,
        lng: lng
      }).subscribe({
        next: () => this.showFeedback('Ubicación del administrador actualizada.', 'success'),
        error: (err) => {
          console.error(err);
          this.showFeedback('Error al actualizar ubicación en el servidor.', 'error');
        }
      });
    }
  }

  // --- Guard Management Logic ---


  // --- Guard Management Logic ---


  public searchGuard() {
    // If we are currently editing this guard, DO NOT reset everything
    if (this.isPickingLocation && this.selectedGuard) {
      // Check if the search is triggered for the same guard (e.g. marker click)
      if (this.selectedGuard.idEmpleado.toString().toLowerCase() === this.searchId.trim().toLowerCase()) {
        return;
      }
    }

    this.selectedGuard = null;
    this.cancelPick(); // Reset pick state if active

    if (!this.searchId || !this.searchId.trim()) {
      this.showFeedback('Por favor, ingrese un ID.', 'error');
      return;
    }

    // Case insensitive search
    const term = this.searchId.trim().toLowerCase();

    this.selectedGuard = this.guards.find(g =>
      g.idEmpleado && g.idEmpleado.toString().toLowerCase() === term
    );

    if (!this.selectedGuard) {
      this.showFeedback('Guardia no encontrado', 'error');
    } else {
      // Center map on guard if they have a location
      if (this.selectedGuard.lat && this.selectedGuard.lng && this.map) {
        this.map.flyTo([parseFloat(this.selectedGuard.lat), parseFloat(this.selectedGuard.lng)], 16);
      }
    }
  }

  private showFeedback(message: string, type: 'success' | 'error') {
    this.feedbackMessage = message;
    this.feedbackType = type;
    setTimeout(() => this.feedbackMessage = '', 4000);
  }

  // --- Location Picking (Google Maps Style) ---

  // Temp storage for original location to rollback on cancel
  private originalLocation: { lat: number, lng: number } | null = null;
  // Track the temporary marker being dragged
  private tempMarker: any = null;

  public enableGuardLocationPick() {
    if (!this.selectedGuard) return;
    this.isPickingLocation = true;

    // If guard already has location, make their marker draggable
    if (this.selectedGuard.lat && this.selectedGuard.lng) {
      this.originalLocation = { lat: this.selectedGuard.lat, lng: this.selectedGuard.lng };

      const marker = this.guardMarkers.get(this.selectedGuard.idEmpleado);
      if (marker) {
        this.tempMarker = marker;
        marker.dragging.enable();
        marker.closeTooltip(); // Hide tooltip while editing

        // Listen to drag events to visually update
        marker.on('dragend', () => {
          this.ngZone.run(() => {
            // Just for UI update if needed, actual save is manual
          });
        });
      }
    } else {
      this.originalLocation = null; // No previous location
      this.showFeedback('Haz clic en el mapa para colocar el marcador', 'success');
    }
  }

  public confirmGuardLocation() {
    if (!this.selectedGuard) return;

    let lat, lng;

    if (this.tempMarker) {
      const latLng = this.tempMarker.getLatLng();
      lat = latLng.lat;
      lng = latLng.lng;
    } else {
      this.showFeedback('Debes colocar un marcador primero', 'error');
      return;
    }

    // Update Data
    this.selectedGuard.lat = lat;
    this.selectedGuard.lng = lng;

    this.updateGuard(this.selectedGuard).subscribe({
      next: () => {
        this.showFeedback(`Ubicación de ${this.selectedGuard.nombre} guardada.`, 'success');
        this.finishPick(true); // Keep changes
      },
      error: (err) => {
        console.error('Error updating guard', err);
        this.showFeedback('Error al guardar ubicación en servidor', 'error');
      }
    });
  }

  public cancelPick() {
    if (!this.isPickingLocation) return;

    // Rollback changes
    if (this.originalLocation && this.selectedGuard) {
      this.selectedGuard.lat = this.originalLocation.lat;
      this.selectedGuard.lng = this.originalLocation.lng;
    } else if (this.selectedGuard) {
      // Was new, so remove it
      this.selectedGuard.lat = null;
      this.selectedGuard.lng = null;
    }

    this.finishPick(false);
  }

  private finishPick(save: boolean) {
    this.isPickingLocation = false;
    this.originalLocation = null;

    // Remove the temp marker layer explicitly if it exists
    if (this.tempMarker && this.map) {
      this.map.removeLayer(this.tempMarker);
    }
    this.tempMarker = null;

    // Full refresh to ensure clean state (correct icon colors, tooltips, non-draggable)
    this.refreshGuardMarkers();
  }

  // Modified map click handler called from ngOnInit
  public assignGuardLocation(lat: number, lng: number) {
    // This is called when user CLICKS the map in picking mode

    if (!this.tempMarker) {
      // Create new marker if we don't have one yet
      if (this.L) {
        this.tempMarker = this.L.marker([lat, lng], {
          icon: this.getGuardIcon(this.L, this.selectedGuard.estado),
          draggable: true
        }).addTo(this.map);

        this.tempMarker.on('dragend', () => {
          this.ngZone.run(() => { });
        });

        // Allow dragging immediately
        this.tempMarker.dragging.enable();
      }
    } else {
      // Move existing marker to click spot
      this.tempMarker.setLatLng([lat, lng]);
    }
  }

  public removeGuardLocation() {
    if (!this.selectedGuard) return;
    if (!confirm('¿Estás seguro de eliminar la ubicación de este guardia?')) return;

    this.selectedGuard.lat = null;
    this.selectedGuard.lng = null;

    this.updateGuard(this.selectedGuard).subscribe({
      next: () => {
        this.refreshGuardMarkers();
        this.showFeedback('Ubicación eliminada', 'success');
      },
      error: (err: any) => this.showFeedback('Error eliminando ubicación', 'error')
    });
  }

  private updateGuard(guard: any) {
    return this.http.patch(`http://localhost:3000/api/guards/${guard.idEmpleado}`, guard);
  }
}
