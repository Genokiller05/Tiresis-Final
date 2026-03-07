// Force re-compile
import { Component, PLATFORM_ID, Inject, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service'; // Importar el AuthService
import { GuardService } from '../../services/guard.service';
import { SupabaseService } from '../../services/supabase.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {

  public searchId: string = '';
  public errorMessage: string = '';
  public successMessage: string = '';
  public currentGuard: any = null;
  public isLogoutModalVisible: boolean = false;
  public isDeleteModalVisible: boolean = false;
  public isEditModalVisible: boolean = false;
  public isLoading: boolean = false;

  // Edit Form
  public editForm = {
    nombre: '',
    email: '',
    area: '',
    telefono: '',
    direccion: '',
    estado: ''
  };

  public activeTab: 'search' | 'register' = 'search';

  // Registration properties (from RegistrosComponent)
  public regForm = {
    nombre: '',
    email: '',
    area: '',
    telefono: '',
    direccion: '',
    idGuardia: ''
  };
  public regImagePreview: string | null = null;
  public regStatusMessage: string = '';
  public regSummaryCardData: any = null;
  public regFieldErrors: { [key: string]: string } = {};
  private regSelectedFile: File | null = null;

  private currentGuardId: string | null = null;
  private presenceChannel: any = null;

  // Theme property
  public currentTheme: 'light' | 'dark' = 'dark';

  // Language properties
  public uiText: any = {};
  public uiRegText: any = {};
  private langSubscription!: Subscription;
  private themeSubscription!: Subscription;
  private realtimeSubscription!: Subscription;
  // Predefined areas for selection
  public areas: string[] = ['Entrada Principal', 'Estacionamiento', 'Edificio A', 'Ronda Perimetral', 'Cámaras', 'Oficinas'];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private themeService: ThemeService,
    private translationService: TranslationService,
    private authService: AuthService,
    private guardService: GuardService,
    private supabaseService: SupabaseService
  ) { }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme.subscribe(theme => {
      this.currentTheme = theme;
    });
    this.langSubscription = this.translationService.uiText.subscribe(translations => {
      this.uiText = translations.home || {};
      this.uiRegText = translations.registros || {}; // Load registration translations
    });
    if (isPlatformBrowser(this.platformId)) {
      this.realtimeSubscription = this.guardService.getGuardUpdates().subscribe(payload => {
        if (this.currentGuardId && payload.new) {
          const isSameGuard = payload.new.document_id === this.currentGuardId || payload.new.idEmpleado === this.currentGuardId;
          if (isSameGuard) {
            this.currentGuard = {
              ...this.currentGuard,
              ...payload.new,
              // Normalize fields to ensure compatibility with UI requirements
              nombre: payload.new.nombre || payload.new.full_name || this.currentGuard.nombre,
              telefono: payload.new.telefono || payload.new.phone || this.currentGuard.telefono,
              estado: payload.new.estado || this.currentGuard.estado,
              // Update activity history in real-time
              actividades: Array.isArray(payload.new.actividades) ? payload.new.actividades : this.currentGuard.actividades,
            };
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
    if (this.presenceChannel) {
      this.supabaseService.client.removeChannel(this.presenceChannel);
      this.presenceChannel = null;
    }
  }

  public onTabChange(tab: 'search' | 'register'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
    this.regStatusMessage = '';
  }

  // --- Registration Methods (from RegistrosComponent) ---
  public onRegFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isPlatformBrowser(this.platformId)) {
      this.regFieldErrors['photo'] = 'La carga de imágenes no está disponible en el servidor.';
      return;
    }

    this.regSelectedFile = file;
    this.regFieldErrors['photo'] = '';

    const reader = new FileReader();
    reader.onload = () => {
      this.regImagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  private validateRegForm(): boolean {
    this.regFieldErrors = {};
    let isValid = true;
    const nameRegex = /^[a-zA-Z\s]+$/;

    if (!this.regForm.nombre.trim() || this.regForm.nombre.trim().length < 3 || !nameRegex.test(this.regForm.nombre)) {
      this.regFieldErrors['nombre'] = 'El nombre es obligatorio y solo debe contener letras.';
      isValid = false;
    }
    if (!this.regForm.idGuardia.trim()) {
      this.regFieldErrors['idGuardia'] = 'El ID de identificación es obligatorio.';
      isValid = false;
    } else if (this.regForm.idGuardia.trim().length !== 8) {
      this.regFieldErrors['idGuardia'] = 'El ID debe tener exactamente 8 caracteres.';
      isValid = false;
    }
    if (this.regForm.telefono && (this.regForm.telefono.length !== 10 || !/^\d+$/.test(this.regForm.telefono))) {
      this.regFieldErrors['telefono'] = 'El teléfono debe tener exactamente 10 dígitos numéricos.';
      isValid = false;
    }
    return isValid;
  }

  public async onRegSubmit(): Promise<void> {
    if (!this.validateRegForm()) {
      this.regStatusMessage = `<span class="text-red-500">${this.uiRegText.validationError || 'Por favor, corrija los errores.'}</span>`;
      return;
    }

    this.isLoading = true;
    this.regStatusMessage = `<span class="text-blue-500">${this.uiRegText.submitting || 'Registrando guardia...'}</span>`;
    this.regSummaryCardData = null;

    try {
      let photoUrl: string | null = null;
      if (this.regSelectedFile) {
        photoUrl = await this.guardService.uploadPhoto(this.regSelectedFile);
      }

      const guardData = {
        full_name: this.regForm.nombre,
        document_id: this.regForm.idGuardia,
        email: this.regForm.email,
        telefono: this.regForm.telefono,
        direccion: this.regForm.direccion,
        area: this.regForm.area,
        photo_url: photoUrl || undefined
      };

      const newGuard = await this.guardService.createGuard(guardData);

      this.regStatusMessage = `<span class="text-green-500 font-bold">${this.uiRegText.successMessage || 'Guardia registrado con éxito.'}</span>`;
      this.regSummaryCardData = { ...newGuard, foto: photoUrl };
      this.resetRegForm();

    } catch (error: any) {
      console.error(error);
      this.regStatusMessage = `<span class="text-red-500">${this.uiRegText.errorMessage || 'Ocurrió un error'}: ${error.message}</span>`;
    } finally {
      this.isLoading = false;
    }
  }

  public resetRegForm(): void {
    this.regForm = { nombre: '', email: '', area: '', telefono: '', direccion: '', idGuardia: '' };
    this.regImagePreview = null;
    this.regSelectedFile = null;
    this.regFieldErrors = {};
  }

  // --- Theme Methods ---
  public setTheme(theme: 'light' | 'dark'): void {
    this.themeService.setTheme(theme);
  }

  public navigateTo(event: Event, path: string): void {
    event.preventDefault();
    this.router.navigate([path]);
  }

  // --- Search and Data Methods ---
  public async onSearch(): Promise<void> {
    this.currentGuard = null;
    this.errorMessage = '';
    this.successMessage = '';

    const searchId = this.searchId.trim();

    if (!searchId) {
      this.errorMessage = 'Por favor, ingrese un ID de guardia.';
      return;
    }

    if (searchId.length !== 8) {
      this.errorMessage = 'El ID debe tener exactamente 8 dígitos para realizar la búsqueda.';
      return;
    }

    this.isLoading = true;
    try {
      const guard = await this.guardService.getGuardById(searchId);
      if (guard) {
        // Normalización para compatibilidad frontend
        this.currentGuard = {
          ...guard,
          nombre: guard.nombre || guard.full_name,
          idEmpleado: guard.idEmpleado || guard.document_id,
          telefono: guard.telefono || guard.phone || '',
          direccion: guard.direccion || '',
          estado: guard.estado || (guard.is_active ? 'En servicio' : 'Fuera de servicio')
        };
        this.currentGuardId = this.currentGuard.idEmpleado;

        // Presence Sync
        if (this.presenceChannel) {
          this.supabaseService.client.removeChannel(this.presenceChannel);
        }

        this.presenceChannel = this.supabaseService.client.channel('online-guards-' + this.currentGuardId);
        this.presenceChannel.on('presence', { event: 'sync' }, () => {
          const state = this.presenceChannel.presenceState();
          const isOnline = Object.keys(state).length > 0;
          if (this.currentGuard) {
            this.currentGuard.estado = isOnline ? 'En servicio' : 'Fuera de servicio';
          }
        }).subscribe();

        this.successMessage = 'Guardia encontrado!';
      } else {
        this.errorMessage = `No se encontró ningún guardia con el ID ${searchId}.`;
      }
    } catch (err: any) {
      this.errorMessage = `No se encontró ningún guardia con el ID ${searchId}.`;
      console.error('Error fetching guard:', err);
    } finally {
      this.isLoading = false;
    }
  }

  public clearSearch(): void {
    if (this.presenceChannel) {
      this.supabaseService.client.removeChannel(this.presenceChannel);
      this.presenceChannel = null;
    }
    this.searchId = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.resetGuardState();
  }

  public async onGuardFileSelected(event: any): Promise<void> {
    const file = event.target.files?.[0];
    if (!file || !this.currentGuardId) {
      this.errorMessage = 'Por favor, primero busque un guardia y luego seleccione un archivo.';
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      this.errorMessage = 'La carga de imágenes no está disponible en el servidor.';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = 'Subiendo imagen...';

    try {
      const newPhotoUrl = await this.guardService.uploadPhoto(file);
      this.errorMessage = 'Actualizando perfil...';

      const updatedGuard = await this.guardService.updateGuard(this.currentGuardId, { foto: newPhotoUrl });

      // Update local state from the response
      this.currentGuard.foto = updatedGuard.foto;

      this.successMessage = 'Foto de perfil actualizada correctamente.';
      this.errorMessage = '';
    } catch (err: any) {
      console.error('Error updating photo:', err);
      this.errorMessage = `Error al actualizar la foto: ${err.message}`;
    } finally {
      this.isLoading = false;
    }
  }

  public getGuardImageUrl(): string {
    if (this.currentGuard && this.currentGuard.foto) {
      // Supabase public URLs are absolute and should be used directly
      if (this.currentGuard.foto.startsWith('http')) {
        return this.currentGuard.foto;
      } else {
        // It's a relative path from our local server
        return `http://localhost:3000${this.currentGuard.foto}`;
      }
    }
    // Fallback for older data structures or if photo is missing
    return 'https://via.placeholder.com/150';
  }

  // --- Delete Methods ---
  public deleteGuard(): void {
    if (!this.currentGuardId) {
      this.errorMessage = 'Por favor, busque y seleccione un guardia primero.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    this.hideEditModal();
    this.showDeleteModal();
  }

  public async confirmDelete(): Promise<void> {
    if (!this.currentGuardId) return;

    this.isLoading = true;
    try {
      await this.guardService.deleteGuard(this.currentGuardId);
      this.successMessage = 'Guardia eliminado permanentemente.';
      this.clearSearch();
      setTimeout(() => this.successMessage = '', 4000);
    } catch (err: any) {
      console.error('Error al eliminar guardia:', err);
      // Extraer mensaje del servidor si existe
      const serverMsg = err.error?.message || err.message;
      this.errorMessage = `Error: ${serverMsg}. Intenta de nuevo.`;
      setTimeout(() => this.errorMessage = '', 6000);
    } finally {
      this.isLoading = false;
      this.hideDeleteModal();
    }
  }

  // --- Modal Methods ---
  public showLogoutModal(): void {
    this.isLogoutModalVisible = true;
  }

  public hideLogoutModal(): void {
    this.isLogoutModalVisible = false;
  }

  public confirmLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  public showDeleteModal(): void {
    this.isDeleteModalVisible = true;
  }

  public hideDeleteModal(): void {
    this.isDeleteModalVisible = false;
  }

  // --- Edit Modal Methods ---
  public showEditModal(): void {
    if (!this.currentGuard) return;
    this.editForm = {
      nombre: this.currentGuard.nombre || this.currentGuard.full_name,
      email: this.currentGuard.email || '',
      area: this.currentGuard.area || '',
      telefono: this.currentGuard.telefono || this.currentGuard.phone || '',
      direccion: this.currentGuard.direccion || '',
      estado: this.currentGuard.estado || 'Fuera de servicio'
    };
    this.isEditModalVisible = true;
  }

  public hideEditModal(): void {
    this.isEditModalVisible = false;
  }

  public async saveEditGuard(): Promise<void> {
    if (!this.currentGuardId) return;

    this.isLoading = true;
    const updatedData = {
      nombre: this.editForm.nombre,
      full_name: this.editForm.nombre, // Compatibilidad
      email: this.editForm.email,
      area: this.editForm.area,
      telefono: this.editForm.telefono,
      phone: this.editForm.telefono, // Compatibilidad
      direccion: this.editForm.direccion,
      estado: this.editForm.estado,
      is_active: this.editForm.estado === 'En servicio'
    };

    const phoneRegex = /^\d{10}$/;
    if (this.editForm.telefono && !phoneRegex.test(this.editForm.telefono)) {
      this.errorMessage = 'El teléfono debe tener exactamente 10 dígitos numéricos.';
      this.isLoading = false;
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    try {
      const updatedGuard = await this.guardService.updateGuard(this.currentGuardId, updatedData);

      // Update local state from response
      this.currentGuard = {
        ...this.currentGuard,
        nombre: updatedGuard.nombre || updatedGuard.full_name,
        email: updatedGuard.email,
        area: updatedGuard.area,
        telefono: updatedGuard.telefono || updatedGuard.phone,
        direccion: updatedGuard.direccion,
        estado: updatedGuard.estado
      };

      this.successMessage = 'Datos actualizados correctamente.';
      this.hideEditModal();
      setTimeout(() => this.successMessage = '', 3000);
    } catch (err: any) {
      console.error('Error updating guard:', err);
      this.errorMessage = 'Error al actualizar los datos.';
    } finally {
      this.isLoading = false;
    }
  }

  // --- Private Helper ---
  private resetGuardState(): void {
    this.currentGuard = null;
    this.currentGuardId = null;
  }
}

