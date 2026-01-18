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

  public onGuardFileSelected(event: any): void { // No async
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

    const reader = new FileReader();
    reader.onload = () => {
      const newPhotoPath = reader.result as string;

      // Actualizar la imagen en el JsonStorageService
      let guards = this.jsonStorageService.getData('guards') || [];
      const index = guards.findIndex((g: any) => g.idEmpleado === this.currentGuardId);
      if (index > -1) {
        guards[index].foto = newPhotoPath;
        this.jsonStorageService.setData('guards', guards);
        this.currentGuard.foto = newPhotoPath; // Actualizar la imagen del guardia actual
        this.successMessage = 'Foto de perfil actualizada permanentemente.';
        this.errorMessage = '';
      } else {
        this.errorMessage = 'Guardia no encontrado para actualizar la foto.';
      }
    };
    reader.readAsDataURL(file);
  }

  public getGuardImageUrl(): string {
    if (this.currentGuard && this.currentGuard.foto) {
      // Si la foto es una URL base64, usarla directamente
      if (this.currentGuard.foto.startsWith('data:image')) {
        return this.currentGuard.foto;
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
