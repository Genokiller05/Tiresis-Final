// Force re-compile
import { Component, PLATFORM_ID, Inject, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { TranslationService } from '../../services/translation.service';
import { JsonStorageService } from '../../services/json-storage.service'; // Importar el nuevo servicio
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
    private jsonStorageService: JsonStorageService, // Inyectar JsonStorageService
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
  public onSearch(): void {
    this.currentGuard = null;
    this.errorMessage = '';
    this.successMessage = '';

    const searchId = this.searchId.trim();

    if (!searchId) {
      this.errorMessage = 'Por favor, ingrese un ID de guardia.';
      return;
    }

    // Use GuardService to fetch from backend
    this.guardService.getGuardById(searchId).subscribe({
      next: (guard: any) => {
        if (guard) {
          this.currentGuard = guard;
          this.currentGuardId = guard.idEmpleado;
          this.successMessage = 'Guardia encontrado!';
        }
      },
      error: (err: any) => {
        this.errorMessage = `No se encontró ningún guardia con el ID ${searchId}.`;
        console.error('Error fetching guard:', err);
      }
    });
  }

  public clearSearch(): void {
    this.searchId = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.resetGuardState();
  }

  public onGuardFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file || !this.currentGuardId) {
      this.errorMessage = 'Por favor, primero busque un guardia y luego seleccione un archivo.';
      return;
    }

    if (!isPlatformBrowser(this.platformId)) {
      this.errorMessage = 'La carga de imágenes no está disponible en el servidor.';
      return;
    }

    this.successMessage = '';
    this.errorMessage = 'Subiendo imagen...';

    // Use GuardService to upload
    this.guardService.uploadPhoto(file).subscribe({
      next: (response) => {
        const newPhotoUrl = response.url;

        // Update current guard object
        this.currentGuard.foto = newPhotoUrl;

        // Persist changes to backend via updateGuard
        this.guardService.updateGuard(this.currentGuardId!, { foto: newPhotoUrl }).subscribe({
          next: () => {
            this.successMessage = 'Foto de perfil actualizada correctamente.';
            this.errorMessage = '';
          },
          error: (err) => {
            console.error('Error saving photo url to guard:', err);
            this.errorMessage = 'Error al guardar la referencia de la foto.';
          }
        });
      },
      error: (err) => {
        console.error('Error uploading photo:', err);
        this.errorMessage = 'Error al subir la imagen al servidor.';
      }
    });
  }

  public getGuardImageUrl(): string {
    if (this.currentGuard && this.currentGuard.foto) {
      // Si la foto es una URL base64, usarla directamente
      if (this.currentGuard.foto.startsWith('data:image')) {
        return this.currentGuard.foto;
      }
      // NEW: Handle server uploads
      if (this.currentGuard.foto.startsWith('/uploads/')) {
        return 'http://localhost:3000' + this.currentGuard.foto;
      }
      // Si es una ruta relativa a assets, usarla
      if (this.currentGuard.foto.startsWith('assets/images/guards/')) {
        return this.currentGuard.foto;
      }
    }
    return 'https://via.placeholder.com/150'; // Imagen por defecto
  }

  // --- Delete Methods ---
  public deleteGuard(): void {
    if (!this.currentGuardId) {
      // Although the button should be disabled, this is a safeguard
      this.errorMessage = 'Por favor, busque y seleccione un guardia primero.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    this.showDeleteModal();
  }

  public confirmDelete(): void { // No async
    if (!this.currentGuardId) return;

    let guards = this.jsonStorageService.getData('guards') || [];
    guards = guards.filter((g: any) => g.idEmpleado !== this.currentGuardId);
    this.jsonStorageService.setData('guards', guards);

    this.successMessage = 'Guardia eliminado correctamente.';
    this.clearSearch(); // Use clearSearch to reset the view
    setTimeout(() => this.successMessage = '', 3000);

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
    this.authService.logout(); // Usar el servicio de autenticación
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
      email: this.currentGuard.email,
      area: this.currentGuard.area
    };
    this.isEditModalVisible = true;
  }

  public hideEditModal(): void {
    this.isEditModalVisible = false;
  }

  public saveEditGuard(): void {
    if (!this.currentGuardId) return;

    const updatedData = {
      nombre: this.editForm.nombre,
      email: this.editForm.email,
      area: this.editForm.area
    };

    this.guardService.updateGuard(this.currentGuardId, updatedData).subscribe({
      next: () => {
        // Update local state
        this.currentGuard.nombre = updatedData.nombre;
        this.currentGuard.email = updatedData.email;
        this.currentGuard.area = updatedData.area;

        this.successMessage = 'Datos actualizados correctamente.';
        this.hideEditModal();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error updating guard:', err);
        this.errorMessage = 'Error al actualizar los datos.';
      }
    });
  }

  // --- Private Helper ---
  private renderNotFound(): void {
    this.resetGuardState();
    this.errorMessage = 'No se encontró ningún guardia con ese ID.';
  }

  private resetGuardState(): void {
    this.currentGuard = null;
    this.currentGuardId = null;
  }
}
