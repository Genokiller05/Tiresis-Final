import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { GeocodingService } from '../../services/geocoding.service';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-admin-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div class="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        
        <!-- Welcome Screen -->
        <div *ngIf="step === 'welcome'" class="text-center space-y-6">
          <div class="text-6xl text-purple-600 mb-4">
            <i class="fas fa-check-circle"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Bienvenido a TERISIS {{adminData.fullName.split(' ')[0]}}
          </h1>
          <p class="text-gray-600 dark:text-gray-300">
            Tu cuenta de administrador ha sido creada exitosamente.
          </p>
          <button (click)="startApp()" 
                  class="w-full px-6 py-3 mt-4 text-lg font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            Comenzar
          </button>
        </div>

        <!-- Registration Form -->
        <div *ngIf="step === 'form'">
          <h1 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">Crear Cuenta Admin</h1>
          
          <form (ngSubmit)="register()" class="space-y-4">
            
            <!-- Full Name -->
            <div>
              <label for="fullName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
              <input type="text" id="fullName" name="fullName" [(ngModel)]="adminData.fullName" required
                     class="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-200 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500">
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
              <input type="email" id="email" name="email" [(ngModel)]="adminData.email" required
                     class="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-200 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500">
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" id="password" name="password" [(ngModel)]="adminData.password" required
                       class="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-200 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 pr-10">
                <button type="button" (click)="togglePasswordVisibility()" class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none">
                  <span class="material-icons">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Solo se permiten letras (mayúsculas o minúsculas) y números. No se permiten símbolos.
              </p>
            </div>

            <!-- Confirm Password -->
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Contraseña</label>
              <div class="relative">
                  <input [type]="showPassword ? 'text' : 'password'" id="confirmPassword" name="confirmPassword" [(ngModel)]="confirmPassword" required
                         class="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-200 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 pr-10">
                  <button type="button" (click)="togglePasswordVisibility()" class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none">
                    <span class="material-icons">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                  </button>
              </div>
            </div>

            <!-- Company Name / Residence -->
            <div>
              <label for="companyName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la Compañía / Residencia</label>
              <input type="text" id="companyName" name="companyName" [(ngModel)]="adminData.companyName" required
                     class="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-200 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500">
            </div>

            <!-- Location Dropdowns -->
            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación</label>
              
              <!-- Country -->
              <select [(ngModel)]="selectedCountry" (change)="onCountryChange()" name="country" required
                      class="w-full px-4 py-2 text-gray-900 bg-gray-200 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500">
                <option value="" disabled selected>Selecciona un país</option>
                <option *ngFor="let country of countries" [value]="country.name">{{ country.name }}</option>
              </select>

              <!-- State -->
              <select [(ngModel)]="selectedState" (change)="onStateChange()" name="state" [disabled]="!selectedCountry" required
                      class="w-full px-4 py-2 text-gray-900 bg-gray-200 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 disabled:opacity-50">
                <option value="" disabled selected>Selecciona un estado/región</option>
                <option *ngFor="let state of states" [value]="state">{{ state }}</option>
              </select>

              <!-- City -->
              <select [(ngModel)]="selectedCity" name="city" [disabled]="!selectedState" required
                      class="w-full px-4 py-2 text-gray-900 bg-gray-200 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 disabled:opacity-50">
                <option value="" disabled selected>Selecciona una ciudad</option>
                <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
              </select>

              <!-- Street -->
              <input type="text" [(ngModel)]="street" name="street" required placeholder="Calle, Número, Colonia"
                     class="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-200 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500">
            </div>

            <!-- Error Message -->
            <div *ngIf="error" class="text-sm text-red-600 dark:text-red-400 font-medium">
              {{ error }}
            </div>

            <!-- Actions -->
            <div class="pt-2 space-y-3">
              <button type="submit" [disabled]="isLoading"
                      class="w-full px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
                {{ isLoading ? 'Validando y Registrando...' : 'Registrar' }}
              </button>
              
              <button type="button" (click)="goToLogin()"
                      class="w-full px-4 py-2 font-medium text-purple-600 bg-transparent border border-purple-600 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                Volver al Login
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  `
})
export class AdminRegisterComponent implements OnInit {
  step: 'form' | 'welcome' = 'form';
  adminData: any = {
    fullName: '',
    email: '',
    password: '',
    companyName: ''
  };

  confirmPassword: string = '';
  showPassword: boolean = false;

  // Location properties
  countries: any[] = [];
  states: string[] = [];
  cities: string[] = [];

  selectedCountry: string = '';
  selectedState: string = '';
  selectedCity: string = '';
  street: string = '';

  error = '';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private geocodingService: GeocodingService,
    private locationService: LocationService
  ) { }

  ngOnInit() {
    this.loadCountries();
  }

  loadCountries() {
    this.locationService.getCountries().subscribe({
      next: (data) => this.countries = data,
      error: (err) => console.error('Error loading countries', err)
    });
  }

  onCountryChange() {
    this.states = [];
    this.cities = [];
    this.selectedState = '';
    this.selectedCity = '';
    this.locationService.getStates(this.selectedCountry).subscribe({
      next: (data) => this.states = data,
      error: (err) => console.error('Error loading states', err)
    });
  }

  onStateChange() {
    this.cities = [];
    this.selectedCity = '';
    this.locationService.getCities(this.selectedCountry, this.selectedState).subscribe({
      next: (data) => this.cities = data,
      error: (err) => console.error('Error loading cities', err)
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  register() {
    this.error = '';

    // Validar campos vacíos
    if (!this.adminData.fullName || !this.adminData.email || !this.adminData.password || !this.adminData.companyName) {
      this.error = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    if (!this.confirmPassword) {
      this.error = 'Por favor confirma tu contraseña.';
      return;
    }

    if (!this.selectedCountry || !this.selectedState || !this.selectedCity || !this.street) {
      this.error = 'Por favor completa todos los campos de ubicación.';
      return;
    }

    // Validar que las contraseñas coincidan
    if (this.adminData.password !== this.confirmPassword) {
      this.error = 'Error: Las contraseñas no coinciden.';
      return;
    }

    // Validar contraseña (solo letras y números)
    const passwordRegex = /^[a-zA-Z0-9]+$/;
    if (!passwordRegex.test(this.adminData.password)) {
      this.error = 'Error: La contraseña solo puede contener letras y números. No agregue símbolos.';
      return;
    }

    // 1. Validar ubicación con búsqueda estructurada y estrategias de respaldo
    const addressData = {
      street: this.street,
      city: this.selectedCity,
      state: this.selectedState,
      country: this.selectedCountry
    };

    this.geocodingService.searchAddressStructured(addressData).subscribe({
      next: (result) => {
        if (!result) {
          this.isLoading = false;
          // Show the user what we searched for so they can correct it
          this.error = `No pudimos validar la ubicación: "${this.street}". Por favor verifica que la calle, colonia y número sean correctos y reconocibles en el mapa.`;
          this.cdr.detectChanges();
          return;
        }

        console.log('Ubicación encontrada vía:', result.method);
        console.log('Dirección normalizada:', result.display_name);

        // Si fue un fallback muy general (solo ciudad), podríamos advertir al usuario, 
        // pero para este caso de uso permitiremos el registro para no bloquearlo.

        // 2. Agregar coordenadas a los datos del admin
        this.adminData.lat = result.lat;
        this.adminData.lng = result.lon;
        this.adminData.location = result.display_name; // Guardamos la dirección oficial encontrada

        // 3. Proceder al registro
        this.performRegistration();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Error de conexión al validar la ubicación. Intente más tarde.';
        this.cdr.detectChanges();
      }
    });
  }

  performRegistration() {
    this.authService.registerAdmin(this.adminData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.step = 'welcome';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Error al registrar administrador.';
        this.cdr.detectChanges();
      }
    });
  }

  startApp() {
    // Navigate to login so user can verify credentials
    this.router.navigate(['/login']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
