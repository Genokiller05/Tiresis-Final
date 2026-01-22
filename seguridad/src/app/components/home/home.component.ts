// Force re-compile
import { Component, PLATFORM_ID, Inject, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service'; // Importar el AuthService
import { GuardService } from '../../services/guard.service'; // Import GuardService
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule], // Eliminar SidebarComponent de imports
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {

  public searchId: string = '';
  public errorMessage: string = '';
  public successMessage: string = '';
  public currentGuard: any = null; // Store the entire guard object
  public isLogoutModalVisible: boolean = false;
  public isDeleteModalVisible: boolean = false;
  public isEditModalVisible: boolean = false; // Add Edit Modal state
  public isLoading: boolean = false;

  // Edit Form
  public editForm = {
    nombre: '',
    email: '',
    area: ''
  };

  private currentGuardId: string | null = null;

  // Theme property
  public currentTheme: 'light' | 'dark' = 'dark';

  // Language properties
  public uiText: any = {};
  private langSubscription!: Subscription;
  private themeSubscription!: Subscription;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private themeService: ThemeService,
    private translationService: TranslationService,
    private authService: AuthService, // Inyectar AuthService
    private guardService: GuardService // Inject GuardService
  ) { }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme.subscribe(theme => {
      this.currentTheme = theme;
    });
    this.langSubscription = this.translationService.uiText.subscribe(translations => {
      this.uiText = translations.home || {};
    });
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
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

    this.isLoading = true;
    try {
      const guard = await this.guardService.getGuardById(searchId);
      if (guard) {
        this.currentGuard = guard;
        this.currentGuardId = guard.document_id; // Correct property from view
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
    this.showDeleteModal();
  }

  public async confirmDelete(): Promise<void> {
    if (!this.currentGuardId) return;

    this.isLoading = true;
    // This should call a service method e.g., `this.guardService.deleteGuard(this.currentGuardId)`
    // For now, we will just simulate success as delete is not implemented in the service
    console.warn('Delete functionality is not fully implemented in the service.');

    this.successMessage = 'Guardia eliminado (simulado).';
    this.clearSearch();
    setTimeout(() => this.successMessage = '', 3000);

    this.isLoading = false;
    this.hideDeleteModal();
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
      nombre: this.currentGuard.nombre,
      email: this.currentGuard.email || '', // email might not exist
      area: this.currentGuard.area || ''    // area might not exist
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
      full_name: this.editForm.nombre,
      // email and area are not in the 'profiles' table based on the schema.
      // If they were, you would add them here.
    };

    try {
      const updatedGuard = await this.guardService.updateGuard(this.currentGuardId, updatedData);

      // Update local state from response
      this.currentGuard.nombre = updatedGuard.full_name;

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

