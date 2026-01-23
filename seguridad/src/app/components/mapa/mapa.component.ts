import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { GeocodingService } from '../../services/geocoding.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css' // Note: styleUrl is correct for newer Angular, but stylesUrl is standard. Leaving as is if original was like this.
})
export class MapaComponent implements OnInit, OnDestroy {

  private map: any;
  private adminMarker: any;
  private guardMarkers: Map<string, any> = new Map(); // Map guard ID to marker
  private L: any; // Cache Leaflet instance

  // Zone Management
  private drawnItems: any; // FeatureGroup for the zone
  private adminZoneLayer: any = null; // The actual polygon layer
  public adminZoneCoords: any[] = []; // Coordinates of the zone
  private drawControl: any;

  // UI State
  public isTracking: boolean = false;
  private watchId: number | null = null;
  public isEditingAdmin: boolean = false; // Deprecated conceptually, but keeping ref if needed, though we will rely on isTracking
  public isDrawingZone: boolean = false; // New state for zone editor
  public searchId: string = '';
  public selectedGuard: any = null;
  public isPickingLocation: boolean = false;

  public feedbackMessage: string = '';
  public feedbackType: 'success' | 'error' = 'success';
  public guards: any[] = [];

  // --- Building Management (Overpass API + Custom) ---
  private buildingsLayer: any;
  private customBuildingsLayer: any;
  public isCreatingBuilding: boolean = false;
  public customBuildings: any[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private http: HttpClient,
    private ngZone: NgZone,
    private geocodingService: GeocodingService
  ) { }

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      await this.initMap();
      this.loadGuards();
      this.loadCustomBuildings();
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
    // Dynamically import leaflet-draw only on client side
    await import('leaflet-draw');
    const L = this.L;

    // Default location
    let lat = 19.4326;
    let lng = -99.1332;
    let zoom = 12;

    // Helper to initialize map once coordinates are settled
    const createMap = (latitude: number, longitude: number, z: number, user: any) => {

      // 1. Define Base Layers
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 3,
        attribution: 'OpenStreetMap'
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      });

      // 2. Create Map with Default Layer
      this.map = L.map('map', {
        center: [latitude, longitude],
        zoom: z,
        layers: [satelliteLayer], // Defaulting to Satellite as requested ("me gusta la vista satelitar")
        attributionControl: false
      });

      // 3. Add Layer Control (Toggle between views)
      const baseMaps = {
        "Satélite": satelliteLayer,
        "Mapa Normal": osmLayer
      };

      L.control.layers(baseMaps, null, { position: 'bottomright' }).addTo(this.map);

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


      // Initialize Drawn Items Layer
      this.drawnItems = new L.FeatureGroup();
      this.map.addLayer(this.drawnItems);

      // Load existing zone if any
      this.loadAdminZone();

      // Force refresh guards (if already loaded, though loadGuards will do it too)
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
          // Load zone from backend if available
          if (adminData.zone) {
            this.adminZoneCoords = adminData.zone;
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

  // --- Zone Management Logic ---



  private loadBuildingsInZone() {
    if (!this.adminZoneCoords || this.adminZoneCoords.length < 3) return;

    // Clear previous buildings
    if (this.buildingsLayer) {
      this.map.removeLayer(this.buildingsLayer);
    }
    this.buildingsLayer = this.L.layerGroup().addTo(this.map);

    this.showFeedback('Cargando edificios de la zona...', 'success');

    this.geocodingService.getBuildingsInPolygon(this.adminZoneCoords).subscribe({
      next: (data: any) => {
        if (!data || !data.elements || data.elements.length === 0) {
          console.warn('No buildings found in this zone.');
          // Don't error out, just log
          return;
        }

        let count = 0;
        data.elements.forEach((element: any) => {
          if (element.geometry && (element.type === 'way' || element.type === 'relation')) {
            const latlngs = element.geometry.map((p: any) => [p.lat, p.lon]);

            // Calculate center for filtering
            const bounds = this.L.latLngBounds(latlngs);
            const center = bounds.getCenter();

            // STRICT FILTERING ENABLED
            if (this.isPointInZone(center.lat, center.lng)) {
              // Create polygon for the building
              const buildingPoly = this.L.polygon(latlngs, {
                color: '#3b82f6', // Darker Blue for OSM
                weight: 1,
                fillColor: '#60a5fa', // Light Blue
                fillOpacity: 0.4
              });

              // Add tooltip if name exists
              const name = element.tags?.name || 'Edificio';
              if (element.tags?.name) {
                buildingPoly.bindTooltip(name, {
                  permanent: true,
                  direction: 'center',
                  className: 'font-bold text-xs text-blue-800 bg-white/70 px-1 rounded shadow-sm'
                });
              }

              const buildingType = element.tags?.building || 'Estructura';

              const container = document.createElement('div');
              container.innerHTML = `
                          <div class="text-center">
                            <h3 class="font-bold text-sm">${name}</h3>
                            <p class="text-xs text-gray-500 capitalize mb-2">${buildingType}</p>
                            <p class="text-[10px] text-gray-400">OpenStreetMap</p>
                            <button class="btn-assign bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 w-full cursor-pointer">
                              Asignar Guardia Aquí
                            </button>
                          </div>
                        `;

              const btn = container.querySelector('.btn-assign');
              if (btn) {
                btn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  this.ngZone.run(() => {
                    this.handleBuildingClick(latlngs, name);
                    this.map.closePopup();
                  });
                });
              }

              buildingPoly.bindPopup(container);

              buildingPoly.on('click', (e: any) => {
                if (this.isPickingLocation && this.selectedGuard) {
                  this.L.DomEvent.stop(e);
                  this.ngZone.run(() => {
                    this.handleBuildingClick(latlngs, name);
                  });
                }
              });

              this.buildingsLayer.addLayer(buildingPoly);
              count++;
            }
          }
        });

        if (count > 0) {
          this.showFeedback(`${count} edificios públicos detectados.`, 'success');
        }
      },
      error: (err) => {
        console.warn('Overpass API busy or error, skipping OSM buildings.', err);
        this.showFeedback('Aviso: Servidor de mapas saturado. Mostrando solo edificios locales.', 'success');
        // Do not block other logic
      }
    });
  }

  private handleBuildingClick(latlngs: any[], buildingName: string) {
    // Calculate center
    const bounds = this.L.latLngBounds(latlngs);
    const center = bounds.getCenter();

    if (this.selectedGuard) {
      // If we are in picking mode, or if a guard is just selected (we can start picking mode automatically)
      if (!this.isPickingLocation) {
        this.enableGuardLocationPick();
      }

      // Move the guard/marker to center
      // Use setTimeout to ensure picking mode is fully active if just enabled
      setTimeout(() => {
        this.assignGuardLocation(center.lat, center.lng);
        this.showFeedback(`Guardia asignado a: ${buildingName}`, 'success');
        // Auto confirm for better UX here?
        this.confirmGuardLocation();
      }, 100);

    } else {
      this.showFeedback('Selecciona un guardia primero para asignarlo aquí.', 'error');
    }
  }

  private loadAdminZone() {
    if (!this.adminZoneCoords || this.adminZoneCoords.length === 0 || !this.map || !this.L) return;

    // Remove existing if any
    if (this.adminZoneLayer) {
      this.drawnItems.removeLayer(this.adminZoneLayer);
    }

    // Create Polygon
    this.adminZoneLayer = this.L.polygon(this.adminZoneCoords, {
      color: '#9333ea',
      fillColor: '#9333ea',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '5, 5'
    });

    this.drawnItems.addLayer(this.adminZoneLayer);

    // Apply strict bounds + 5km buffer
    this.applyZoneRestriction();

    // Load Buildings
    this.loadBuildingsInZone();
  }

  private applyZoneRestriction() {
    if (!this.adminZoneLayer || !this.map || !this.L) return;

    // Calculate ~5km buffer (approx 0.045 degrees)
    const buffer = 0.045;
    const bounds = this.adminZoneLayer.getBounds();

    // Expand bounds
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    const paddedSouthWest = this.L.latLng(southWest.lat - buffer, southWest.lng - buffer);
    const paddedNorthEast = this.L.latLng(northEast.lat + buffer, northEast.lng + buffer);

    const restrictedBounds = this.L.latLngBounds(paddedSouthWest, paddedNorthEast);

    this.map.setMaxBounds(restrictedBounds);
    this.map.setMinZoom(11);
    this.map.fitBounds(bounds);
  }

  private removeZoneRestriction() {
    if (!this.map) return;
    this.map.setMaxBounds(null);
    this.map.setMinZoom(3);
  }

  public toggleZoneEditor() {
    this.isDrawingZone = !this.isDrawingZone;
    this.isCreatingBuilding = false; // Mutually exclusive

    if (this.isDrawingZone) {
      this.enableDrawControl('zone');
      this.showFeedback('Dibuja los puntos de tu zona en el mapa. Cierra la forma para terminar.', 'success');

      // Remove restriction so they can draw freely
      this.removeZoneRestriction();

      // Clear buildings temporarily while editing
      if (this.buildingsLayer) {
        this.map.removeLayer(this.buildingsLayer);
      }

      if (this.adminZoneLayer) {
        this.drawnItems.removeLayer(this.adminZoneLayer);
        this.adminZoneLayer = null;
      }
    } else {
      this.disableDrawControl();
      if (!this.adminZoneLayer && this.adminZoneCoords.length > 0) {
        this.loadAdminZone();
      }
    }
  }

  public toggleBuildingCreation() {
    this.isCreatingBuilding = !this.isCreatingBuilding;
    this.isDrawingZone = false; // Mutually exclusive

    if (this.isCreatingBuilding) {
      this.enableDrawControl('building');
      this.showFeedback('Dibuja el contorno del nuevo edificio.', 'success');
    } else {
      this.disableDrawControl();
    }
  }

  private enableDrawControl(mode: 'zone' | 'building' = 'zone') {
    if (!this.map || !this.L) return;

    const Leaflet = this.L.Draw ? this.L : (window as any).L;

    if (!Leaflet || !Leaflet.Draw || !Leaflet.Draw.Polygon) {
      this.showFeedback('Error cargando la herramienta de dibujo.', 'error');
      return;
    }

    const color = mode === 'zone' ? '#9333ea' : '#06b6d4'; // Purple for zone, Cyan for building

    const polygonDrawer = new Leaflet.Draw.Polygon(this.map, {
      allowIntersection: false,
      showArea: false,
      shapeOptions: {
        color: color,
        fillColor: color,
        fillOpacity: 0.5
      }
    });

    polygonDrawer.enable();
    this.drawControl = polygonDrawer;

    this.map.on(Leaflet.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;

      if (mode === 'zone') {
        if (this.adminZoneLayer) {
          this.drawnItems.removeLayer(this.adminZoneLayer);
        }
        this.drawnItems.addLayer(layer);
        this.adminZoneLayer = layer;
        const latlngs = layer.getLatLngs()[0];
        const coords = latlngs.map((ll: any) => [ll.lat, ll.lng]);
        this.adminZoneCoords = coords;
        this.saveAdminZone(coords);

        this.isDrawingZone = false;

        // Re-apply restrictions and load buildings
        this.applyZoneRestriction();
        this.loadBuildingsInZone();

      } else if (mode === 'building') {
        const name = prompt('Nombre del Edificio:', 'Nuevo Edificio');
        if (name) {
          const latlngs = layer.getLatLngs()[0];
          const geometry = latlngs.map((ll: any) => [ll.lat, ll.lng]);

          const newBuilding = {
            name: name,
            geometry: geometry,
            type: 'custom'
          };

          this.http.post('http://localhost:3000/api/buildings', newBuilding).subscribe({
            next: (res: any) => {
              this.showFeedback('Edificio creado exitosamente', 'success');
              this.loadCustomBuildings(); // Reload to draw properly with events
            },
            error: () => this.showFeedback('Error guardando edificio', 'error')
          });
        }
        this.isCreatingBuilding = false;
        // Don't add to map here manually, reload will do it. 
        // Actually, we should probably remove the drawn layer because real one comes from API
        // Leaflet Draw doesn't auto-add to map unless we tell it, but e.layer is in memory.
      }
    });
  }

  private disableDrawControl() {
    if (this.drawControl) {
      this.drawControl.disable();
      this.drawControl = null;
    }
    if (this.map && this.L) {
      this.map.off(this.L.Draw.Event.CREATED);
    }
  }

  private saveAdminZone(coords: any[]) {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.http.patch('http://localhost:3000/api/admins/update', {
      email: user.email,
      zone: coords
    }).subscribe({
      next: () => {
        this.showFeedback('Zona de seguridad guardada exitosamente.', 'success');
        const updatedUser = { ...user, zone: coords };
        this.authService.setCurrentUser(updatedUser);
      },
      error: (err) => {
        console.error(err);
        this.showFeedback('Error guardando la zona.', 'error');
      }
    });
  }

  private loadCustomBuildings() {
    if (!this.map || !this.L) return;

    // Initialize layer group if needed
    if (!this.customBuildingsLayer) {
      this.customBuildingsLayer = this.L.layerGroup().addTo(this.map);
    } else {
      this.customBuildingsLayer.clearLayers();
    }

    this.http.get<any[]>('http://localhost:3000/api/buildings').subscribe({
      next: (buildings) => {
        this.customBuildings = buildings;
        console.log('Loaded custom buildings:', buildings.length);
        if (buildings.length > 0) {
          this.showFeedback(`Cargados ${buildings.length} edificios personalizados.`, 'success');
        } else {
          this.showFeedback('No hay edificios personalizados guardados.', 'success');
        }
        buildings.forEach(b => {
          console.log('Dibujando:', b.name, b.geometry);
          this.drawCustomBuilding(b);
        });
      },
      error: (e) => {
        console.error('Error loading custom buildings', e);
        this.showFeedback('Error cargando edificios.', 'error');
      }
    });
  }

  private drawCustomBuilding(building: any) {
    const polygon = this.L.polygon(building.geometry, {
      color: '#06b6d4', // Cyan
      weight: 3,
      fillColor: '#06b6d4',
      fillOpacity: 0.5
    }).addTo(this.customBuildingsLayer);

    // Add Permanent Label
    polygon.bindTooltip(building.name, {
      permanent: true,
      direction: 'center',
      className: 'font-bold text-sm text-black bg-yellow-300 px-2 py-1 rounded shadow-md border border-black'
    });

    const popupContent = document.createElement('div');
    popupContent.innerHTML = `
      <div style="text-align:center; min-width: 150px;">
        <h3 style="margin:0; font-weight:bold; color:#0e7490; font-size:14px;">${building.name}</h3>
        <p style="margin:2px 0 8px; font-size:10px; color:#666; font-style:italic;">Edificio Personalizado</p>
        
        <button class="assign-btn" style="
          background-color: #7c3aed; 
          color: white; 
          border: none; 
          padding: 6px 12px; 
          border-radius: 4px; 
          cursor: pointer; 
          font-size: 11px;
          margin-bottom: 4px;
          width: 100%;
          font-weight: 500;">
          Asignar Guardia
        </button>

        <button class="delete-btn" style="
          background-color: #ef4444; 
          color: white; 
          border: none; 
          padding: 6px 12px; 
          border-radius: 4px; 
          cursor: pointer; 
          font-size: 11px;
          width: 100%;
          font-weight: 500;">
          Eliminar
        </button>
      </div>
    `;

    polygon.bindPopup(popupContent);

    polygon.on('popupopen', () => {
      setTimeout(() => {
        const assignBtn = popupContent.querySelector('.assign-btn');
        if (assignBtn) {
          assignBtn.addEventListener('click', () => {
            this.ngZone.run(() => {
              this.handleBuildingClick(building.geometry, building.name);
              this.map.closePopup();
            });
          });
        }
        const deleteBtn = popupContent.querySelector('.delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            if (confirm(`¿Eliminar edificio "${building.name}"?`)) {
              this.ngZone.run(() => {
                this.deleteCustomBuilding(building.id);
                this.map.closePopup();
              });
            }
          });
        }
      }, 0);
    });
  }

  private deleteCustomBuilding(id: string) {
    this.http.delete(`http://localhost:3000/api/buildings/${id}`).subscribe({
      next: () => {
        this.showFeedback('Edificio eliminado', 'success');
        this.loadCustomBuildings();
      },
      error: () => this.showFeedback('Error eliminando edificio', 'error')
    });
  }

  // Ray-casting algorithm to check if point is in polygon
  private isPointInZone(lat: number, lng: number): boolean {
    if (!this.adminZoneCoords || this.adminZoneCoords.length < 3) return true; // No zone defined = free unrestricted

    let inside = false;
    const polygon = this.adminZoneCoords;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];

      const intersect = ((yi > lng) !== (yj > lng))
        && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
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

  // --- Admin Location Logic (Automatic) ---

  public toggleTracking() {
    if (this.isTracking) {
      this.stopTracking();
    } else {
      this.startTracking();
    }
  }

  private startTracking() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!('geolocation' in navigator)) {
      this.showFeedback('Geolocalización no soportada.', 'error');
      return;
    }

    this.isTracking = true;
    this.showFeedback('Rastreo automático activado.', 'success');

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.ngZone.run(() => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Move marker
          if (this.adminMarker) {
            this.adminMarker.setLatLng([lat, lng]);
            // Optional: Center map on user periodically or on first fix? 
            // constant centering can be annoying if user wants to look around.
            // Let's just update the marker.
          } else if (this.L && this.map) {
            // Create if missing
            this.createAdminMarker(this.L, lat, lng, this.authService.getCurrentUser());
          }

          // Save to DB
          this.saveAdminLocation(lat, lng);
        });
      },
      (err) => {
        console.error(err);
        this.showFeedback('Error obteniendo ubicación GPS.', 'error');
        // Don't stop immediately on one error, retry logic exists in watch, 
        // but if persistent maybe notify user.
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  private stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.showFeedback('Rastreo detenido.', 'success');
  }

  ngOnDestroy() {
    this.stopTracking();
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

        // Track for rollback
        let lastValidPos = { lat: this.selectedGuard.lat, lng: this.selectedGuard.lng };

        // Listen to drag events to visually update
        marker.on('dragend', () => {
          this.ngZone.run(() => {
            const newPos = marker.getLatLng();
            if (!this.isPointInZone(newPos.lat, newPos.lng)) {
              this.showFeedback('¡Zona Restringida! No puedes sacar al guardia del área.', 'error');
              marker.setLatLng([lastValidPos.lat, lastValidPos.lng]);
            } else {
              lastValidPos = { lat: newPos.lat, lng: newPos.lng };
            }
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

    // Check Geofence
    if (!this.isPointInZone(lat, lng)) {
      this.showFeedback('¡ALERTA! No puedes asignar guardias fuera de tu zona permitida.', 'error');

      // Optional: animate camera to zone center to show where it is?
      // Or create a temporary red warning circle at the click spot?
      if (this.L && this.map) {
        const warningCircle = this.L.circleMarker([lat, lng], {
          radius: 20,
          color: 'red',
          fillColor: '#f00',
          fillOpacity: 0.5
        }).addTo(this.map);
        setTimeout(() => this.map.removeLayer(warningCircle), 1000);
      }
      return;
    }

    if (!this.tempMarker) {
      // Create new marker if we don't have one yet
      if (this.L) {
        this.tempMarker = this.L.marker([lat, lng], {
          icon: this.getGuardIcon(this.L, this.selectedGuard.estado),
          draggable: true
        }).addTo(this.map);

        // Track valid position for rollback
        let lastValidPos = { lat, lng };

        this.tempMarker.on('dragend', () => {
          this.ngZone.run(() => {
            const newPos = this.tempMarker.getLatLng();
            if (!this.isPointInZone(newPos.lat, newPos.lng)) {
              this.showFeedback('¡Zona Restringida! El guardia debe permanecer dentro del perímetro.', 'error');
              this.tempMarker.setLatLng([lastValidPos.lat, lastValidPos.lng]);
            } else {
              lastValidPos = { lat: newPos.lat, lng: newPos.lng };
            }
          });
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
