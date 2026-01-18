// Force re-compile
import { Component, PLATFORM_ID, Inject, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { TranslationService } from '../../services/translation.service';
import { JsonStorageService } from '../../services/json-storage.service'; // Importar el nuevo servicio
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-registros',
  standalone: true,
  imports: [CommonModule, FormsModule], // Eliminar SidebarComponent de imports
  templateUrl: './registros.component.html',
  styleUrls: ['./registros.component.css']
})
export class RegistrosComponent implements OnInit, OnDestroy {

  // Form model properties
  public nombre: string = '';
  public email: string = '';
  public area: string = '';
  public idGuardia: string = '';
  public imagePreview: string | null = null;
  public photoUrl: string = ''; // To store the URL from the server, now local base64

  // State management properties
  public statusMessage: string = '';
  public summaryCardData: any = null;
  public fieldErrors: { [key: string]: string } = {};

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
    private jsonStorageService: JsonStorageService // Inyectar JsonStorageService
  ) {}

  ngOnInit(): void {
    this.idGuardia = this.generarIdGuardia();
    this.themeSubscription = this.themeService.currentTheme.subscribe(theme => {
      this.currentTheme = theme;
    });
    this.langSubscription = this.translationService.uiText.subscribe(translations => {
      this.uiText = translations.registros || {};
    });
  }

  ngOnDestroy(): void {
    if (this.langSubscription) this.langSubscription.unsubscribe();
    if (this.themeSubscription) this.themeSubscription.unsubscribe();
  }

  public generarIdGuardia(): string {
    let newId: string;
    let guards = this.jsonStorageService.getData('guards') || [];
    do {
      newId = 'GRD' + Math.floor(100 + Math.random() * 900).toString(); // GRDxxx
    } while (guards.some((g: any) => g.idEmpleado === newId));
    return newId;
  }

  public setAndDisplayNewId(): void {
    this.idGuardia = this.generarIdGuardia();
  }

  public async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!isPlatformBrowser(this.platformId)) {
        this.fieldErrors['photo'] = 'La carga de imágenes no está disponible en el servidor.';
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.photoUrl = reader.result as string; // Usar base64 como URL
    };
    reader.readAsDataURL(file);
    this.fieldErrors['photo'] = '';
  }

  private validateUniqueness(): boolean {
    const existingGuards = this.jsonStorageService.getData('guards') || [];

    if (existingGuards.some((g: any) => g.email === this.email)) {
      this.fieldErrors['email'] = 'Este correo electrónico ya está en uso.';
      return false;
    }

    if (existingGuards.some((g: any) => g.idEmpleado === this.idGuardia)) {
      this.fieldErrors['idGuardia'] = 'Este ID ya existe. Por favor, genere uno nuevo.';
      return false;
    }

    return true;
  }

  private validateForm(): boolean {
    this.fieldErrors = {};
    let isValid = true;
    const nameRegex = /^[a-zA-Z\s]+$/;

    if (!this.nombre.trim()) {
      this.fieldErrors['nombre'] = 'El nombre es obligatorio.';
      isValid = false;
    } else if (this.nombre.trim().length < 3) {
      this.fieldErrors['nombre'] = 'El nombre debe tener al menos 3 caracteres.';
      isValid = false;
    } else if (!nameRegex.test(this.nombre)) {
      this.fieldErrors['nombre'] = 'El nombre solo puede contener letras y espacios.';
      isValid = false;
    }

    if (!this.email.trim()) {
      this.fieldErrors['email'] = 'El email es obligatorio.';
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(this.email)) {
      this.fieldErrors['email'] = 'El formato del email no es válido.';
      isValid = false;
    }

    if (!this.area) {
      this.fieldErrors['area'] = 'Debe seleccionar un área.';
      isValid = false;
    }

    if (!this.photoUrl) {
      this.fieldErrors['photo'] = 'Debe seleccionar una imagen.';
      isValid = false;
    }
    
    return isValid;
  }

  public onSubmit(): void { // No async
    if (!this.validateForm()) {
      this.statusMessage = `<span class="text-red-500">${this.uiText.validationError || 'Por favor, corrija los errores en el formulario.'}</span>`;
      return;
    }

    this.statusMessage = `<span class="text-blue-500">${this.uiText.validating || 'Validando información...'}</span>`;
    if (!this.validateUniqueness()) {
        this.statusMessage = `<span class="text-red-500">${this.uiText.validationError || 'El email o ID ya existen.'}</span>`;
        return;
    }

    this.statusMessage = `<span class="text-blue-500">${this.uiText.submitting || 'Registrando guardia...'}</span>`;
    this.summaryCardData = null;

    const guardData = {
      idEmpleado: this.idGuardia, // Usar 'idEmpleado' para consistencia con los datos de ejemplo
      nombre: this.nombre,
      email: this.email,
      area: this.area,
      estado: 'Fuera de servicio',
      foto: this.photoUrl,
      actividades: []
    };

    try {
      let guards = this.jsonStorageService.getData('guards') || [];
      guards.push(guardData);
      this.jsonStorageService.setData('guards', guards);

      this.statusMessage = `<span class="text-green-500 font-bold">${this.uiText.successMessage || 'Guardia registrado con éxito.'}</span>`;
      this.summaryCardData = guardData; // Usar guardData directamente para el resumen
      this.resetForm();

    } catch (error: any) {
      this.statusMessage = `<span class="text-red-500">${this.uiText.errorMessage || 'Ocurrió un error'}: ${error.message}</span>`;
    }
  }

  private resetForm(): void {
    this.nombre = '';
    this.email = '';
    this.area = '';
    this.imagePreview = null;
    this.photoUrl = '';
    this.fieldErrors = {};
    this.idGuardia = this.generarIdGuardia();
  }
  
  public setTheme(theme: 'light' | 'dark'): void {
    this.themeService.setTheme(theme);
  }
}