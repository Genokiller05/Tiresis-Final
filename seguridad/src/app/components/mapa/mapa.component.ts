import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { GeocodingService } from '../../services/geocoding.service';
import { ActivatedRoute } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css' // Note: styleUrl is correct for newer Angular, but stylesUrl is standard. Leaving as is if original was like this.
})
export class MapaComponent implements OnInit, OnDestroy {
  public console = console;

  private map: any;
  private isMapReady: boolean = false;
  private adminMarker: any;
  private guardMarkers: Map<string, any> = new Map(); // Map guard ID to marker
  private L: any; // Cache Leaflet instance
  private adminCenter: { lat: number; lng: number } | null = null; // For 4km bound
  private firstFix: boolean = true; // For satellite tracking centering

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
  private refreshIntervalId: any;

  public feedbackMessage: string = '';
  public feedbackType: 'success' | 'error' = 'success';
  public guards: any[] = [];

  // --- Building Management (Overpass API + Custom) ---
  private buildingsLayer: any;
  private customBuildingsLayer: any;
  public isCreatingBuilding: boolean = false;
  public customBuildings: any[] = [];
  public isBuildingModalVisible: boolean = false;
  public newBuildingName: string = 'Nuevo Edificio';
  private pendingBuildingLayer: any = null;

  // Heatmap
  private heatmapLayer: any = null;
  public isHeatmapActive: boolean = false;

  public isPremiumUser: boolean = false;
  public isSubmittingBuilding: boolean = false; // Debounce flag
  public pendingNotification: any = null; // Latest pending notification for the user

  private presenceChannel: any = null;
  private onlineGuardIds = new Set<string>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private http: HttpClient,
    private ngZone: NgZone,
    private geocodingService: GeocodingService,
    private route: ActivatedRoute,
    private reportService: ReportService,
    private supabaseService: SupabaseService
  ) { }

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      this.isPremiumUser = this.authService.isPremium();
      await this.initMap();
      this.loadGuards();
      
      this.route.queryParams.subscribe(params => {
        if (params['heatmap'] === 'true' && !this.isHeatmapActive) {
          this.toggleHeatmap(true);
        }
      });

      this.setupPresence();

      this.loadNotifications();

      // Set up polling every 10 seconds for real-time feel
      this.refreshIntervalId = setInterval(() => {
        this.loadGuards();
        this.loadNotifications();
      }, 10000);
    }
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
    this.stopTracking();
    if (this.presenceChannel) {
      this.supabaseService.client.removeChannel(this.presenceChannel);
      this.presenceChannel = null;
    }
  }

  private loadNotifications() {
    const userProfile = this.authService.getCurrentUser();
    const userId = userProfile?.idEmpleado || userProfile?.document_id || userProfile?.id;
    if (!userId) return;

    this.http.get<any[]>(`http://localhost:3000/api/notifications/${userId}`).subscribe({
      next: (notifs) => {
        // Filter for the latest pending notification
        const pending = notifs.filter(n => n.status === 'pending')[0];
        this.pendingNotification = pending || null;
      },
      error: (err) => console.error('[MAPA] Error loading user notifications', err)
    });
  }

  public acknowledgeNotification(notifId: string) {
    this.http.patch(`http://localhost:3000/api/notifications/${notifId}/acknowledge`, {}).subscribe({
      next: () => {
        this.pendingNotification = null;
        this.refreshGuardMarkers(); // Refresh to show green color
        this.loadGuards(); // Refresh guard list state
      },
      error: (err) => console.error('[MAPA] Error acknowledging notification', err)
    });
  }

  private loadGuards() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.http.get<any[]>('http://localhost:3000/api/guards').subscribe({
      next: (data) => {
        this.guards = (data || []).map(guard => this.normalizeGuardExtended(guard));
        this.syncGuardPresence(); // Ensure offline ones show as offline
        this.refreshGuardMarkers();
      },
      error: (err) => console.error('Error loading guards', err)
    });
  }

  private setupPresence() {
    this.presenceChannel = this.supabaseService.client.channel('online-guards');
    this.presenceChannel.on('presence', { event: 'sync' }, () => {
      this.syncGuardPresence();
    }).subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        this.syncGuardPresence();
      }
    });
  }

  private syncGuardPresence(): void {
    if (!this.presenceChannel) return;
    this.ngZone.run(() => {
      const state = this.presenceChannel.presenceState();
      this.onlineGuardIds.clear();
      for (const key in state) {
        for (const presence of state[key] as any[]) {
          if (presence.id) this.onlineGuardIds.add(presence.id);
        }
      }

      let changed = false;
      for (const guard of this.guards) {
        const isOnline = this.onlineGuardIds.has(guard.idEmpleado) || this.onlineGuardIds.has(guard.document_id);
        let newStatus = guard.estado;
        if (isOnline) {
          newStatus = 'En servicio';
        } else if (guard.estado === 'En servicio') {
          newStatus = 'Fuera de servicio';
        }

        if (guard.estado !== newStatus) {
          guard.estado = newStatus;
          changed = true;
        }
      }

      if (changed) {
        this.refreshGuardMarkers();
      }
    });
  }

  private normalizeGuardExtended(guard: any): any {
    const isOnline = this.onlineGuardIds.has(guard.idEmpleado) || this.onlineGuardIds.has(guard.document_id);
    let st = guard.estado;
    if (isOnline) {
        st = 'En servicio';
    } else if (guard.estado === 'En servicio' && this.presenceChannel) {
        st = 'Fuera de servicio'; // Auto-degrade if channel connected
    }
    return { ...guard, estado: st };
  }

  private async initMap(): Promise<void> {
    try {
      if (this.map) return; // Seguridad extrema: no re-inicializar
      
      const LeafletModule: any = await import('leaflet');
      this.L = LeafletModule.default || LeafletModule;
      const L = this.L;

      if (typeof window !== 'undefined') {
        (window as any).L = L;
      }

      await import('leaflet-draw');
      await import('leaflet.heat');
      this.L = (window as any).L || L;

      // Variables de ubicación por defecto
      let lat = 19.4326;
      let lng = -99.1332;
      let zoom = 12;

      const createMap = (latitude: number, longitude: number, z: number, user: any) => {
        if (this.map) return;

        console.debug('[MAPA] Creando instancia de mapa en:', latitude, longitude);
        
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, minZoom: 3, attribution: 'OpenStreetMap', className: 'tactical-tile'
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri', maxZoom: 19, className: 'tactical-tile'
        });

        this.map = L.map('map', {
          center: [latitude, longitude],
          zoom: z,
          layers: [satelliteLayer],
          attributionControl: false
        });

        this.map.on('draw:created', (e: any) => this.onDrawCreated(e));

        const baseMaps = { "Satélite": satelliteLayer, "Mapa Normal": osmLayer };
        L.control.layers(baseMaps, null, { position: 'bottomright' }).addTo(this.map);

        this.drawnItems = new L.FeatureGroup();
        this.map.addLayer(this.drawnItems);

        if (user && user.lat && user.lng) {
          this.createAdminMarker(L, parseFloat(user.lat), parseFloat(user.lng), user);
        }

        this.adminCenter = { lat: latitude, lng: longitude };
        this.apply4kmBounds(latitude, longitude);

        this.map.on('click', (e: any) => {
          this.ngZone.run(() => {
            if (this.isPickingLocation && this.selectedGuard) {
              this.assignGuardLocation(e.latlng.lat, e.latlng.lng);
            }
          });
        });

        this.loadAdminZone();
        this.loadCustomBuildings();

        if (this.guards.length > 0) {
          this.refreshGuardMarkers();
        }

        this.isMapReady = true;
        
        // Fix de dimensiones inmediato + retardado
        this.map.invalidateSize();
        setTimeout(() => this.map.invalidateSize(), 500);
      };

      // Obtener usuario y arrancar
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && currentUser.email) {
        this.http.get<any>(`http://localhost:3000/api/admins/${currentUser.email}`).subscribe({
          next: (adminData) => {
            let fLat = lat, fLng = lng, fZoom = zoom;
            if (adminData.lat && adminData.lng) {
              fLat = parseFloat(adminData.lat); fLng = parseFloat(adminData.lng); fZoom = 15;
            }
            if (adminData.zone) {
              try {
                const raw = typeof adminData.zone === 'string' ? JSON.parse(adminData.zone) : adminData.zone;
                this.adminZoneCoords = (raw as any[]).filter((c: any) => Array.isArray(c) && c.length >= 2);
              } catch (e) { this.adminZoneCoords = []; }
            }
            // Esperar un frame al DOM
            setTimeout(() => createMap(fLat, fLng, fZoom, adminData), 100);
          },
          error: () => setTimeout(() => createMap(lat, lng, zoom, currentUser), 100)
        });
      } else {
        setTimeout(() => createMap(lat, lng, zoom, null), 100);
      }
    } catch (e) {
      console.error('[MAPA] Error en initMap:', e);
    }
  }

  // --- Zone Management Logic ---



  private loadBuildingsInZone() {
    if (!isPlatformBrowser(this.platformId)) return;
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
        // Overpass can be hit or miss depending on their server load.
        // We handle this gracefully by showing a feedback message and not logging as a warning/error.
        this.showFeedback('Aviso: Servidor de mapas saturado. Mostrando solo edificios locales.', 'success');
      }
    });
  }

  private handleBuildingClick(latlngs: any[], buildingName: string) {
    // Fix 4: Calculate center from latlngs (Leaflet [lat,lng] format)
    // Validate geometry before computing bounds
    if (!latlngs || latlngs.length < 3) {
      this.showFeedback('Geometría del edificio inválida.', 'error');
      return;
    }

    const bounds = this.L.latLngBounds(latlngs);
    const center = bounds.getCenter();

    if (this.selectedGuard) {
      if (!this.isPickingLocation) {
        this.enableGuardLocationPick();
      }

      // Fix 4: Add a small random offset so multiple guards in same building don't stack
      const offsetLat = (Math.random() - 0.5) * 0.0003;
      const offsetLng = (Math.random() - 0.5) * 0.0003;

      setTimeout(() => {
        this.assignGuardLocation(center.lat + offsetLat, center.lng + offsetLng);
        this.confirmGuardLocation(buildingName);
      }, 100);

    } else {
      this.showFeedback('Selecciona un guardia primero para asignarlo aquí.', 'error');
    }
  }

  private loadAdminZone() {
    if (!this.adminZoneCoords || !this.map || !this.L) return;

    // Fix: Parse if the zone came back as a JSON string from the server
    if (typeof this.adminZoneCoords === 'string') {
      try {
        this.adminZoneCoords = JSON.parse(this.adminZoneCoords as any);
      } catch (e) {
        console.warn('Zone coords could not be parsed, resetting.');
        this.adminZoneCoords = [];
        return;
      }
    }

    // Fix: Filter out any null/invalid coordinate pairs before passing to Leaflet
    const validCoords = (this.adminZoneCoords as any[]).filter(
      (c: any) => Array.isArray(c) && c.length >= 2 && c[0] != null && c[1] != null
    );

    if (validCoords.length < 3) return; // Need at least 3 points for a polygon

    // Remove existing if any
    if (this.adminZoneLayer) {
      this.drawnItems.removeLayer(this.adminZoneLayer);
    }

    // Create Polygon with validated coordinates
    try {
      this.adminZoneLayer = this.L.polygon(validCoords, {
        color: '#9333ea',
        fillColor: '#9333ea',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5'
      });
      this.drawnItems.addLayer(this.adminZoneLayer);
    } catch (e) {
      console.warn('Could not create zone polygon:', e);
      return;
    }

    // Apply strict bounds + 5km buffer
    this.applyZoneRestriction();

    // Load Buildings
    this.loadBuildingsInZone();
  }

  // Fix 1: Apply 4km radius MaxBounds from admin center
  private apply4kmBounds(lat: number, lng: number) {
    if (!this.map || !this.L) return;
    // ~4km in degrees: 1° latitude ≈ 111km → 4km ≈ 0.036°
    const delta = 0.036;
    const sw = this.L.latLng(lat - delta, lng - delta);
    const ne = this.L.latLng(lat + delta, lng + delta);
    this.map.setMaxBounds(this.L.latLngBounds(sw, ne));
    this.map.setMinZoom(13);
  }

  private applyZoneRestriction() {
    if (!this.adminZoneLayer || !this.map || !this.L) return;

    const buffer = 0.02; // tighter buffer within 4km zone
    const bounds = this.adminZoneLayer.getBounds();

    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    const paddedSouthWest = this.L.latLng(southWest.lat - buffer, southWest.lng - buffer);
    const paddedNorthEast = this.L.latLng(northEast.lat + buffer, northEast.lng + buffer);

    const restrictedBounds = this.L.latLngBounds(paddedSouthWest, paddedNorthEast);

    this.map.setMaxBounds(restrictedBounds);
    this.map.setMinZoom(13);
    this.map.fitBounds(bounds);
  }

  private removeZoneRestriction() {
    if (!this.map || !this.adminCenter) return;
    // When removing zone restriction, restore the 4km limit
    this.apply4kmBounds(this.adminCenter.lat, this.adminCenter.lng);
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
    if (!this.isPremiumUser && this.customBuildings.length >= 5) {
      this.showFeedback('Ya alcanzaste el límite de edificios, si quieres poner más tienes que tener el plan Premium.', 'error');
      return;
    }

    this.isCreatingBuilding = !this.isCreatingBuilding;
    this.isDrawingZone = false; // Mutually exclusive

    if (this.isCreatingBuilding) {
      this.enableDrawControl('building');
      this.showFeedback('Dibuja el contorno del nuevo edificio.', 'success');
    } else {
      this.disableDrawControl();
    }
  }

  private onDrawCreated(e: any) {
    const layer = e.layer;
    const mode = this.isDrawingZone ? 'zone' : (this.isCreatingBuilding ? 'building' : null);

    console.log(`[MAPA] Dibujo completado. Modo detectado: ${mode}`);

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
      this.applyZoneRestriction();
      this.loadBuildingsInZone();
      this.disableDrawControl();

    } else if (mode === 'building') {
      this.pendingBuildingLayer = layer;
      this.pendingBuildingLayer.addTo(this.map); // Add to map immediately so it's visible
      this.newBuildingName = 'Nuevo Edificio';
      this.isBuildingModalVisible = true;
      // Note: We don't disableDrawControl yet to keep the UI state consistent until confirmation
    }
  }

  private enableDrawControl(mode: 'zone' | 'building' = 'zone') {
    if (!this.map || !this.L) return;

    const Leaflet = this.L.Draw ? this.L : (window as any).L;

    if (!Leaflet || !Leaflet.Draw || !Leaflet.Draw.Polygon) {
      console.error('[MAPA] Leaflet Draw no cargado correctamente');
      return;
    }

    if (this.drawControl) {
      this.drawControl.disable();
    }

    const color = mode === 'zone' ? '#9333ea' : '#06b6d4';

    this.drawControl = new Leaflet.Draw.Polygon(this.map, {
      allowIntersection: false,
      shapeOptions: { color: color, fillColor: color, fillOpacity: 0.5 }
    });

    this.drawControl.enable();
  }

  confirmBuildingCreation() {
    console.log('[MAPA] Confirmando creación de edificio:', this.newBuildingName);

    if (!this.newBuildingName.trim()) {
      this.showFeedback('Nombre de edificio requerido.', 'error');
      return;
    }

    if (!this.pendingBuildingLayer) {
      console.error('[MAPA] No hay una capa de dibujo pendiente.');
      this.closeBuildingModal();
      return;
    }

    try {
      // Extraer coordenadas de forma segura
      let latlngsRaw = this.pendingBuildingLayer.getLatLngs();
      // Si es un polígono/rectángulo básico, los puntos están en el primer elemento del array anidado
      let latlngs = Array.isArray(latlngsRaw[0]) ? latlngsRaw[0] : latlngsRaw;

      const geometry = latlngs.map((ll: any) => [ll.lat, ll.lng]);

      const newBuilding = {
        name: this.newBuildingName,
        geometry: geometry
      };

      console.log('[MAPA] Enviando edificio al servidor:', newBuilding);

      this.http.post('http://localhost:3000/api/buildings', newBuilding).subscribe({
        next: (res: any) => {
          console.log('[MAPA] Edificio guardado con éxito:', res);
          this.showFeedback('Edificio guardado correctamente.', 'success');
          this.loadCustomBuildings();
          this.closeBuildingModal();
        },
        error: (err) => {
          console.error('[MAPA] Error al guardar edificio:', err);
          const errorDetail = err.error?.error || err.message || 'Error técnico';
          this.showFeedback(`Error al guardar: ${errorDetail}`, 'error');
        },
        complete: () => {
          this.isSubmittingBuilding = false;
        }
      });
    } catch (exc) {
      console.error('[MAPA] Excepción procesando geometría:', exc);
      this.showFeedback('Geometría inválida.', 'error');
      this.isSubmittingBuilding = false;
    }
  }

  closeBuildingModal() {
    if (this.pendingBuildingLayer) {
      this.map.removeLayer(this.pendingBuildingLayer);
    }
    this.isBuildingModalVisible = false;
    this.newBuildingName = 'Nuevo Edificio';
    this.pendingBuildingLayer = null;
    this.isCreatingBuilding = false;
  }

  private disableDrawControl() {
    if (this.drawControl) {
      this.drawControl.disable();
      this.drawControl = null;
    }
    if (this.map && this.L && this.L.Draw && this.L.Draw.Event) {
      this.map.off(this.L.Draw.Event.CREATED);
    } else if (this.map) {
      this.map.off('draw:created'); // fallback string event name
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
    // Fix 3 & 5: Guard against map not ready and invalid geometry
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
        if (buildings.length > 0) {
          this.showFeedback(`Cargados ${buildings.length} edificios guardados.`, 'success');
        }
        buildings.forEach(b => {
          // Fix 5: Skip buildings with invalid or missing geometry
          if (!b.geometry || !Array.isArray(b.geometry) || b.geometry.length < 3) {
            console.warn('Edificio con geometría inválida, omitiendo:', b.name);
            return;
          }
          this.drawCustomBuilding(b);
        });
      },
      error: (e) => {
        console.error('Error loading custom buildings', e);
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
    if (!L || !L.divIcon || !L.marker) {
      console.warn('[MAPA] L.marker o L.divIcon no disponibles para AdminMarker');
      return;
    }

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

    // Fetch latest notifications for all guards to show their status colors
    this.http.get<any[]>('http://localhost:3000/api/notifications/latest_all').subscribe({
      next: (notifs) => {
        const notifMap = new Map();
        notifs.forEach(n => notifMap.set(n.user_id, n.status));

        // Add markers for guards with location
        this.guards.forEach(guard => {
          if (guard.lat && guard.lng) {
            const lat = parseFloat(guard.lat);
            const lng = parseFloat(guard.lng);
            const customStatus = notifMap.get(guard.idEmpleado) || null;

            const marker = L.marker([lat, lng], {
              icon: this.getGuardIcon(L, guard.estado, customStatus),
              draggable: false,
              title: guard.idEmpleado
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

            // Click to select this guard
            marker.on('click', () => {
              this.searchId = guard.idEmpleado;
              this.searchGuard();
            });

            this.guardMarkers.set(guard.idEmpleado, marker);
          }
        });
      },
      error: (err) => console.error('[MAPA] Error fetching notification statuses:', err)
    });
  }

  private getGuardIcon(L: any, status: string, customStatus?: string) {
    let color = '#6b7280'; // Default gray

    if (status === 'En servicio') {
      if (customStatus === 'pending') {
        color = '#f97316'; // Orange (Assigned)
      } else if (customStatus === 'acknowledged') {
        color = '#22c55e'; // Green (Confirmed)
      } else {
        color = '#ef4444'; // Red (On duty, no assignment)
      }
    }

    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 1.25rem; height: 1.25rem; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: background-color 0.5s;"></div>`,
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
    this.firstFix = true; // Fix 2: reset so we center on first GPS fix
    this.showFeedback('Rastreo satelital activado. Obteniendo posición...', 'success');

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.ngZone.run(() => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Fix 2: On first GPS fix, fly to user location AND update 4km bounds
          if (this.firstFix && this.map) {
            this.firstFix = false;
            this.adminCenter = { lat, lng };
            this.apply4kmBounds(lat, lng);
            this.map.flyTo([lat, lng], 16);
            this.showFeedback('Posición GPS obtenida. Mapa centrado en tu ubicación.', 'success');
          }

          // Move marker
          if (this.adminMarker) {
            this.adminMarker.setLatLng([lat, lng]);
          } else if (this.L && this.map) {
            this.createAdminMarker(this.L, lat, lng, this.authService.getCurrentUser());
          }

          // Save to DB
          this.saveAdminLocation(lat, lng);
        });
      },
      (err) => {
        console.error(err);
        this.ngZone.run(() => {
          this.showFeedback('Error obteniendo señal GPS. Verifica los permisos del navegador.', 'error');
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
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

  public getSelectedGuardImageUrl(): string {
    if (!this.selectedGuard) return 'https://via.placeholder.com/150';
    const photoUrl = this.selectedGuard.foto || this.selectedGuard.photo_url || this.selectedGuard.image_url;
    if (!photoUrl) return 'https://via.placeholder.com/150';
    if (photoUrl.startsWith('http')) return photoUrl;
    return `http://localhost:3000${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
  }
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

  public confirmGuardLocation(buildingName?: string) {
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

    this.showFeedback('Guardando ubicación y notificando al guardia...', 'success');

    this.updateGuard(this.selectedGuard).subscribe({
      next: () => {
        const dest = buildingName ? ` en ${buildingName}` : ' a una nueva ubicación';
        this.showFeedback(`Ubicación de ${this.selectedGuard.nombre} guardada${dest}.`, 'success');

        // Create notification for the guard
        this.createAssignmentNotification(this.selectedGuard.idEmpleado, `Fuiste asignado al área ${buildingName || 'de vigilancia móvil'}. Por favor confirma recepción.`);

        this.finishPick(true); // Keep changes
      },
      error: (err) => {
        console.error('Error updating guard', err);
        this.showFeedback('Error al guardar ubicación en servidor', 'error');
      }
    });
  }

  private createAssignmentNotification(guardId: string, message: string) {
    const payload = {
      user_id: guardId,
      message: message,
      type: 'assignment'
    };

    this.http.post('http://localhost:3000/api/notifications', payload).subscribe({
      next: () => {
        console.log('[MAPA] Notificación de asignación enviada.');
        this.showFeedback('Notificación enviada al guardia.', 'success');
      },
      error: (err) => console.error('[MAPA] Error al enviar notificación:', err)
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

  // --- Heatmap Logic ---
  public async toggleHeatmap(active?: boolean) {
    const shouldActivate = active !== undefined ? active : !this.isHeatmapActive;
    
    // Si ya estamos en el estado deseado, no hacer nada (previene bucles)
    if (shouldActivate === this.isHeatmapActive && this.heatmapLayer) return;

    this.isHeatmapActive = shouldActivate;

    if (this.isHeatmapActive) {
      await this.loadHeatmapData();
    } else {
      if (this.heatmapLayer) {
        this.map.removeLayer(this.heatmapLayer);
        this.heatmapLayer = null;
      }
    }
  }

  private isHeatmapLoading = false;
  private async loadHeatmapData() {
    if (this.isHeatmapLoading) return;
    this.isHeatmapLoading = true;
    
    console.log('[DEBUG-HEATMAP] Iniciando carga de datos...');
    
    try {
      let attempts = 0;
      while (!this.isMapReady && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!this.map || !this.L) {
        console.error('[DEBUG-HEATMAP] Error: Mapa o Leaflet no inicializados.');
        return;
      }

      // Verificar si el plugin de calor está cargado
      const LHeat = (window as any).L || this.L;
      if (typeof LHeat.heatLayer !== 'function') {
        console.error('[DEBUG-HEATMAP] CRÍTICO: heatLayer no disponible');
        this.showFeedback('Error: Plugin de calor no cargado.', 'error');
        return;
      }

      const [reports, guards] = await Promise.all([
        this.reportService.getReports(),
        new Promise<any[]>((resolve) => {
          this.http.get<any[]>('http://localhost:3000/api/guards').subscribe({
            next: (data) => resolve(data),
            error: (err) => {
              console.error('[DEBUG-HEATMAP] Error cargando guardias:', err);
              resolve([]);
            }
          });
        })
      ]);

      const guardLocations = new Map();
      guards.forEach((g: any) => {
        if (g.lat && g.lng) {
          guardLocations.set(String(g.idEmpleado).trim(), { lat: parseFloat(g.lat), lng: parseFloat(g.lng) });
        }
      });

      const points = reports
        .map((r: any) => {
          let lat = r.gps_lat ? parseFloat(r.gps_lat) : (r.lat ? parseFloat(r.lat) : null);
          let lng = r.gps_lng ? parseFloat(r.gps_lng) : (r.lng ? parseFloat(r.lng) : null);
          if (!lat || !lng) {
            const guardId = String(r.created_by_guard_id || '').trim();
            const loc = guardLocations.get(guardId);
            if (loc) { lat = loc.lat; lng = loc.lng; }
          }
          return (lat && lng) ? [lat, lng, 1.0] : null;
        })
        .filter((p: any) => p !== null);

      if (this.heatmapLayer) {
        this.map.removeLayer(this.heatmapLayer);
      }

      if (points.length > 0) {
        // @ts-ignore
        this.heatmapLayer = LHeat.heatLayer(points, {
          radius: 65,
          blur: 15,
          maxZoom: 15,
          gradient: { 0.2: 'blue', 0.4: 'cyan', 0.6: 'lime', 0.8: 'yellow', 1: 'red' }
        }).addTo(this.map);
        this.showFeedback(`Calor activo: ${points.length} incidentes detectados.`, 'success');
      } else {
        this.showFeedback('Sin incidentes recientes en esta región.', 'success');
      }

    } catch (error) {
      console.error('[DEBUG-HEATMAP] Error:', error);
      this.showFeedback('Error al procesar mapa de calor.', 'error');
    } finally {
      this.isHeatmapLoading = false;
    }
  }
}
