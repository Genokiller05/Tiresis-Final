import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CameraService } from '../../services/camera.service';

type StreamType = 'hls' | 'rtsp';
type StreamMode = 'single' | 'stereo';

interface PlaybackUrls {
  primary: string;
  left: string;
  right: string;
}

interface Camera {
  id: string;
  site_id: string;
  name: string;
  ip: string;
  marca: string;
  modelo: string;
  area: string;
  alertas: number;
  activa: boolean;
  is_active?: boolean;
  primaryStreamUrl: string;
  primaryStreamType: StreamType;
  streamMode: StreamMode;
  stereoEnabled: boolean;
  leftStreamUrl: string;
  leftStreamType: StreamType;
  rightStreamUrl: string;
  rightStreamType: StreamType;
  playbackUrls: PlaybackUrls;
}

@Component({
  selector: 'app-camaras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './camaras.component.html',
  styleUrl: './camaras.component.css'
})
export class CamarasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('primaryVideo') primaryVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('leftVideo') leftVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('rightVideo') rightVideoRef?: ElementRef<HTMLVideoElement>;

  public cameras: Camera[] = [];
  public selectedCamera: Camera | null = null;
  public isDetailsModalVisible = false;
  public isDeleteModalVisible = false;
  public isRegisterModalVisible = false;
  public activeMenuId: string | null = null;
  public editForm: Partial<Camera> = {};
  public newCamera: Partial<Camera> = {};
  public loadError = '';
  public playbackError = '';

  private readonly apiBaseUrl = 'http://localhost:3000';
  private readonly hlsInstances = new Map<string, any>();
  private viewReady = false;

  constructor(private cameraService: CameraService) { }

  async ngOnInit(): Promise<void> {
    this.resetNewCamera();
    await this.cargarDatos();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    queueMicrotask(() => {
      void this.attachSelectedCameraStreams();
    });
  }

  ngOnDestroy(): void {
    this.destroyPlayers();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.cameras = await this.cameraService.getCameras();
      this.selectedCamera = this.cameras[0] || null;
      this.loadError = this.cameras.length ? '' : 'No hay cámaras configuradas todavía.';
    } catch (error) {
      console.error('Error cargando cámaras:', error);
      this.cameras = [];
      this.selectedCamera = null;
      this.loadError = 'No fue posible cargar las cámaras desde el backend.';
    }

    await this.attachSelectedCameraStreams();
  }

  toggleMenu(id: string): void {
    this.activeMenuId = this.activeMenuId === id ? null : id;
  }

  closeMenu(): void {
    this.activeMenuId = null;
  }

  showRegisterModal(): void {
    this.resetNewCamera();
    this.isRegisterModalVisible = true;
  }

  hideRegisterModal(): void {
    this.isRegisterModalVisible = false;
  }

  async registerCamera(): Promise<void> {
    if (!this.newCamera.name || !this.newCamera.area || !this.newCamera.primaryStreamUrl) {
      alert('Nombre, area y stream principal son obligatorios.');
      return;
    }

    if (this.newCamera.streamMode === 'stereo' && (!this.newCamera.leftStreamUrl || !this.newCamera.rightStreamUrl)) {
      alert('Para una cámara estéreo debes capturar stream izquierdo y derecho.');
      return;
    }

    try {
      const response = await this.cameraService.createCamera(this.newCamera);
      const createdCamera = response.camera || response;
      this.cameras = [createdCamera, ...this.cameras];
      this.selectedCamera = createdCamera;
      this.hideRegisterModal();
      await this.attachSelectedCameraStreams();
    } catch (error) {
      console.error('Error creando cámara:', error);
      alert('Error al crear la cámara');
    }
  }

  toggleStatus(camera: Camera): void {
    void this.saveCamera(camera, { activa: !camera.activa, is_active: !camera.activa });
    this.closeMenu();
  }

  showDetails(camera: Camera): void {
    this.selectedCamera = camera;
    this.editForm = { ...camera };
    this.isDetailsModalVisible = true;
    this.closeMenu();
  }

  hideDetailsModal(): void {
    this.isDetailsModalVisible = false;
  }

  async saveDetails(): Promise<void> {
    if (!this.selectedCamera) return;
    await this.saveCamera(this.selectedCamera, this.editForm);
    this.hideDetailsModal();
  }

  requestDelete(camera: Camera): void {
    this.selectedCamera = camera;
    this.isDeleteModalVisible = true;
    this.closeMenu();
  }

  hideDeleteModal(): void {
    this.isDeleteModalVisible = false;
  }

  async confirmDelete(): Promise<void> {
    if (!this.selectedCamera) return;

    try {
      await this.cameraService.deleteCamera(this.selectedCamera.id);
      this.cameras = this.cameras.filter((camera) => camera.id !== this.selectedCamera!.id);
      this.selectedCamera = this.cameras[0] || null;
      this.hideDeleteModal();
      await this.attachSelectedCameraStreams();
    } catch (error) {
      console.error('Error eliminando cámara:', error);
      alert('Error al eliminar la cámara');
    }
  }

  async selectCamera(camera: Camera): Promise<void> {
    this.selectedCamera = camera;
    await this.attachSelectedCameraStreams();
  }

  get hasStereoSelected(): boolean {
    return Boolean(this.selectedCamera?.stereoEnabled);
  }

  private async saveCamera(camera: Camera, updates: Partial<Camera>): Promise<void> {
    try {
      const updatedCamera = await this.cameraService.updateCamera(camera.id, updates);
      this.cameras = this.cameras.map((item) => item.id === camera.id ? updatedCamera : item);
      this.selectedCamera = this.cameras.find((item) => item.id === camera.id) || null;
      await this.attachSelectedCameraStreams();
    } catch (error) {
      console.error('Error actualizando cámara:', error);
      alert('Error al actualizar la cámara');
    }
  }

  private resetNewCamera(): void {
    this.newCamera = {
      name: '',
      ip: '',
      marca: '',
      modelo: '',
      area: '',
      streamMode: 'single',
      primaryStreamType: 'rtsp',
      primaryStreamUrl: '',
      leftStreamType: 'rtsp',
      leftStreamUrl: '',
      rightStreamType: 'rtsp',
      rightStreamUrl: '',
      activa: true
    };
  }

  private async attachSelectedCameraStreams(): Promise<void> {
    if (!this.viewReady) return;

    this.playbackError = '';
    this.destroyPlayers();

    const camera = this.selectedCamera;
    if (!camera) return;

    try {
      await this.attachVideo('primary', this.primaryVideoRef?.nativeElement, camera.playbackUrls?.primary);

      if (camera.stereoEnabled) {
        await this.attachVideo('left', this.leftVideoRef?.nativeElement, camera.playbackUrls?.left);
        await this.attachVideo('right', this.rightVideoRef?.nativeElement, camera.playbackUrls?.right);
      }
    } catch (error) {
      console.error('Error iniciando reproducción:', error);
      this.playbackError = 'No fue posible reproducir el stream seleccionado.';
    }
  }

  private async attachVideo(playerKey: string, element: HTMLVideoElement | undefined, rawUrl?: string): Promise<void> {
    if (!element || !rawUrl) return;

    const sourceUrl = this.toAbsoluteUrl(rawUrl);
    const isHls = sourceUrl.includes('.m3u8');
    element.muted = true;
    element.autoplay = true;
    element.playsInline = true;
    element.controls = true;

    if (isHls) {
      const module = await import('hls.js');
      const Hls = module.default;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hls.loadSource(sourceUrl);
        hls.attachMedia(element);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          void element.play().catch(() => undefined);
        });
        this.hlsInstances.set(playerKey, hls);
        return;
      }
    }

    element.src = sourceUrl;
    element.load();
    void element.play().catch(() => undefined);
  }

  private destroyPlayers(): void {
    for (const hls of this.hlsInstances.values()) {
      hls.destroy();
    }

    this.hlsInstances.clear();

    [this.primaryVideoRef, this.leftVideoRef, this.rightVideoRef].forEach((videoRef) => {
      const element = videoRef?.nativeElement;
      if (!element) return;
      element.pause();
      element.removeAttribute('src');
      element.load();
    });
  }

  private toAbsoluteUrl(value: string): string {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    return `${this.apiBaseUrl}${value}`;
  }
}
