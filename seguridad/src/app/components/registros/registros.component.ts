import { Component, PLATFORM_ID, Inject, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { TranslationService } from '../../services/translation.service';
import { GuardService } from '../../services/guard.service'; // Importar el nuevo servicio
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-registros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registros.component.html',
  styleUrls: ['./registros.component.css']
})
export class RegistrosComponent implements OnInit, OnDestroy {

  // Form model properties
  public nombre: string = '';
  public email: string = '';
  public area: string = '';
  public telefono: string = '';
  public direccion: string = '';
  public idGuardia: string = ''; // Mapeado a document_id
  public imagePreview: string | null = null;
  private selectedFile: File | null = null;

  // State management properties
  public statusMessage: string = '';
  public summaryCardData: any = null;
  public fieldErrors: { [key: string]: string } = {};
  public isLoading: boolean = false;

  // Theme and language properties
  public currentTheme: 'light' | 'dark' = 'dark';
  public uiText: any = {};
  private langSubscription!: Subscription;
  private themeSubscription!: Subscription;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private themeService: ThemeService,
    private translationService: TranslationService,
    private guardService: GuardService // Inyectar GuardService
  ) { }

  ngOnInit(): void {
    // Ya no se genera el ID aquí, la base de datos se encarga.
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

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!isPlatformBrowser(this.platformId)) {
      this.fieldErrors['photo'] = 'La carga de imágenes no está disponible en el servidor.';
      return;
    }

    this.selectedFile = file; // Guardar el archivo para subirlo
    this.fieldErrors['photo'] = '';

    // Generar previsualización
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  private validateForm(): boolean {
    this.fieldErrors = {};
    let isValid = true;
    const nameRegex = /^[a-zA-Z\s]+$/;

    if (!this.nombre.trim() || this.nombre.trim().length < 3 || !nameRegex.test(this.nombre)) {
      this.fieldErrors['nombre'] = 'El nombre es obligatorio y solo debe contener letras.';
      isValid = false;
    }
    if (!this.idGuardia.trim()) {
      this.fieldErrors['idGuardia'] = 'El ID de empleado es obligatorio.';
      isValid = false;
    }

    // Validaciones opcionales pero recomendadas
    if (this.telefono && !/^[0-9]+$/.test(this.telefono)) {
      this.fieldErrors['telefono'] = 'El teléfono solo debe contener números.';
      isValid = false;
    }

    return isValid;
  }

  public async onSubmit(): Promise<void> {
    if (!this.validateForm()) {
      this.statusMessage = `<span class="text-red-500">${this.uiText.validationError || 'Por favor, corrija los errores.'}</span>`;
      return;
    }

    this.isLoading = true;
    this.statusMessage = `<span class="text-blue-500">${this.uiText.submitting || 'Registrando guardia...'}</span>`;
    this.summaryCardData = null;

    try {
      let photoUrl: string | null = null;
      let photoWarning = '';
      // 1. Subir la foto (solo si hay un archivo seleccionado)
      if (this.selectedFile) {
        if (!isPlatformBrowser(this.platformId)) {
          this.statusMessage = `<span class="text-red-500">Error: La carga de imágenes no está disponible en el servidor.</span>`;
          this.isLoading = false;
          return;
        }
        try {
          photoUrl = await this.guardService.uploadPhoto(this.selectedFile);
        } catch (uploadError) {
          console.error('Error uploading guard photo:', uploadError);
          photoWarning = ' La foto no se pudo subir y se usara la imagen predeterminada.';
        }
      }

      // 2. Construir el objeto del guardia
      const guardData = {
        full_name: this.nombre,
        document_id: this.idGuardia,
        email: this.email,
        telefono: this.telefono,
        direccion: this.direccion,
        area: this.area, // Ahora sí se envía
        photo_url: photoUrl || undefined
      };

      // 3. Llamar al servicio para crear el guardia en Supabase
      const newGuard = await this.guardService.createGuard(guardData);

      this.statusMessage = `<span class="text-green-500 font-bold">${this.uiText.successMessage || 'Guardia registrado con éxito.'}</span>`;
      if (photoWarning) {
        this.statusMessage += `<span class="text-amber-400">${photoWarning}</span>`;
      }
      this.summaryCardData = { ...newGuard, foto: newGuard?.foto || photoUrl }; // Mostrar resumen con la foto (si existe)
      this.resetForm();

    } catch (error: any) {
      console.error(error);
      this.statusMessage = `<span class="text-red-500">${this.uiText.errorMessage || 'Ocurrió un error'}: ${error.message}</span>`;
    } finally {
      this.isLoading = false;
    }
  }

  private resetForm(): void {
    this.nombre = '';
    this.email = '';
    this.area = '';
    this.telefono = '';
    this.direccion = '';
    this.idGuardia = '';
    this.imagePreview = null;
    this.selectedFile = null;
    this.fieldErrors = {};
  }
}
