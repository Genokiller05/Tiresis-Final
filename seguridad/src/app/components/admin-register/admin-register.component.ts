import { Component, ChangeDetectorRef, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { GeocodingService } from '../../services/geocoding.service';

@Component({
  selector: 'app-admin-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#0a192f] text-gray-100 flex flex-col font-sans relative overflow-hidden">
      
      <!-- Background Effects (Subtle Blue Glows) -->
      <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <!-- Navbar -->
      <nav class="p-6 flex justify-between items-center z-10 w-full max-w-7xl mx-auto border-b border-white/5">
        <div class="flex items-center gap-3">
             <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
                <span class="font-bold text-white text-xl">T</span>
             </div>
             <span class="text-2xl font-bold tracking-wider text-white">TIRESIS</span>
        </div>
        <button *ngIf="step !== 'landing' && step !== 'success'" (click)="goToLogin()" class="text-gray-400 hover:text-white transition font-medium text-sm border border-transparent hover:border-white/10 px-4 py-2 rounded-lg">
           Iniciar Sesión
        </button>
      </nav>

      <!-- MAIN CONTENT -->
      <div class="flex-grow flex items-center justify-center p-4 z-10 relative">
        
        <!-- STEP 1: LANDING -->
        <div *ngIf="step === 'landing'" class="text-center max-w-5xl animate-fade-in-up">
            <h1 class="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
                Vigilancia inteligente <br> <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">en tiempo real</span>
            </h1>
            <p class="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Sistema integral de seguridad y monitoreo para residenciales, condominios y empresas.
            </p>

            <div class="flex flex-col sm:flex-row gap-6 justify-center">
                <button (click)="step = 'info'" class="px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-medium transition backdrop-blur-sm">
                    Leer más
                </button>
                <button (click)="step = 'form'" class="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-1">
                    Registrar empresa
                </button>
            </div>
        </div>

        <!-- STEP 2: INFO (Reference Image 5 & 4 Style) -->
        <div *ngIf="step === 'info'" class="max-w-6xl w-full animate-fade-in p-4">
             <button (click)="step = 'landing'" class="mb-8 text-gray-400 hover:text-white flex items-center gap-2 transition">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 Volver
             </button>

             <div class="grid lg:grid-cols-2 gap-12 items-center mb-16">
                 <div>
                    <h2 class="text-4xl font-bold mb-6 text-white">Qué hace <span class="text-blue-400">TIRESIS</span></h2>
                    <p class="text-gray-400 text-lg mb-8 leading-relaxed">
                        TIRESIS es un sistema de vigilancia diseñado para residenciales, condominios, oficinas y empresas, 
                        integrando reportes operativos, monitoreo en tiempo real e inteligencia artificial.
                    </p>
                    
                    <div class="space-y-6">
                        <div class="flex gap-4">
                            <div class="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-white">Inteligencia Artificial Integrada</h3>
                                <p class="text-gray-400 text-sm mt-1">Sistema de detección automática de eventos críticos con análisis en tiempo real.</p>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <div class="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 flex-shrink-0">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-white">Respuesta Rápida</h3>
                                <p class="text-gray-400 text-sm mt-1">Reportes manuales completados en 30-60 segundos, optimizados para guardias en campo.</p>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <div class="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-white">Alertas Accionables</h3>
                                <p class="text-gray-400 text-sm mt-1">Notificaciones inteligentes con priorización automática y evidencia visual.</p>
                            </div>
                        </div>
                    </div>
                 </div>
                 
                 <!-- Stats Cards (Right Column or Bottom) -->
                 <div class="grid sm:grid-cols-2 gap-4">
                     <div class="bg-[#112240] p-6 rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition group">
                         <div class="text-4xl font-bold text-blue-400 mb-2 group-hover:scale-105 transition-transform">30-60s</div>
                         <div class="text-gray-300 font-medium">Tiempo de reporte</div>
                         <p class="text-gray-500 text-xs mt-2">Optimizado para velocidad</p>
                     </div>
                     <div class="bg-[#112240] p-6 rounded-2xl border border-indigo-500/20 hover:border-indigo-500/40 transition group">
                         <div class="text-4xl font-bold text-indigo-400 mb-2 group-hover:scale-105 transition-transform">24/7</div>
                         <div class="text-gray-300 font-medium">Monitoreo continuo</div>
                         <p class="text-gray-500 text-xs mt-2">Sin interrupciones</p>
                     </div>
                     <div class="bg-[#112240] p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition group sm:col-span-2">
                         <div class="text-4xl font-bold text-purple-400 mb-2 group-hover:scale-105 transition-transform">100%</div>
                         <div class="text-gray-300 font-medium">Trazabilidad</div>
                         <p class="text-gray-500 text-xs mt-2">Historial completo de eventos y acciones</p>
                     </div>
                 </div>
             </div>

             <div class="text-center">
                 <button (click)="step = 'form'" class="px-12 py-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg shadow-xl shadow-blue-500/20 transition transform hover:-translate-y-1">
                    Comenzar Ahora - Registrar Empresa
                </button>
             </div>
        </div>

        <!-- STEP 3: FORM (Clean & Dark) -->
        <div *ngIf="step === 'form'" class="w-full max-w-lg bg-[#0f203c] border border-blue-500/10 rounded-2xl shadow-2xl p-8 animate-fade-in relative overflow-hidden">
             <!-- Decorative Top Border -->
             <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

             <button (click)="step = 'landing'" class="mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 Volver
             </button>
             
             <h2 class="text-2xl font-bold mb-2 text-white">Registro de Empresa</h2>
             <p class="text-gray-400 text-sm mb-6">Configura tu cuenta de administrador en segundos.</p>

             <form (ngSubmit)="goToPayment()" class="space-y-4">
                 <div>
                     <label class="block text-gray-400 text-xs font-bold uppercase mb-1 ml-1">Nombre Completo</label>
                     <input type="text" [(ngModel)]="adminData.fullName" name="fullName" required placeholder="Ej. Juan Pérez" 
                            class="w-full bg-[#0a192f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition cursor-pointer">
                 </div>
                 
                 <div>
                     <label class="block text-gray-400 text-xs font-bold uppercase mb-1 ml-1">Email Corporativo</label>
                     <input type="email" [(ngModel)]="adminData.email" name="email" required placeholder="Ej. admin@tuempresa.com" 
                            class="w-full bg-[#0a192f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition cursor-pointer">
                 </div>

                 <div>
                     <label class="block text-gray-400 text-xs font-bold uppercase mb-1 ml-1">Dirección / Ubicación</label>
                     <input type="text" [(ngModel)]="street" name="street" required placeholder="Ej. Av. Reforma 123, CDMX" 
                            class="w-full bg-[#0a192f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition cursor-pointer">
                 </div>

                 <div>
                     <label class="block text-gray-400 text-xs font-bold uppercase mb-1 ml-1">Nombre de la Empresa</label>
                     <input type="text" [(ngModel)]="adminData.companyName" name="companyName" required placeholder="Ej. Seguridad Total S.A." 
                            class="w-full bg-[#0a192f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition cursor-pointer">
                 </div>

                 <div *ngIf="error" class="p-3 bg-red-900/20 border border-red-500/20 rounded text-red-300 text-sm flex items-center gap-2">
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     {{ error }}
                 </div>

                 <button type="submit" class="w-full mt-4 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-0.5">
                     Continuar al Pago
                 </button>
             </form>
        </div>

        <!-- STEP 4: PAYMENT (Premium + Gold Accents) -->
        <div *ngIf="step === 'payment'" class="w-full max-w-lg bg-[#0f203c] border border-blue-500/10 rounded-2xl shadow-2xl p-8 animate-fade-in relative overflow-hidden">
             <!-- Decorative Gold Accent -->
             <div class="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-bl-full blur-[40px] pointer-events-none"></div>

             <button (click)="step = 'form'" class="mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm z-10 relative">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 Volver
             </button>
             
             <div class="text-center mb-8">
                <h2 class="text-3xl font-bold mb-2 text-white">Activar Cuenta</h2>
                <p class="text-blue-300/60 text-sm uppercase tracking-widest font-semibold">Plan Premium Empresarial</p>
             </div>

             <!-- Price Card -->
             <div class="bg-[#0a192f] border border-blue-500/20 rounded-xl p-6 mb-8 shadow-inner">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-gray-400 text-sm">Costo de activación</span>
                    <span class="text-white font-bold text-xl">$10.00 MXN</span>
                </div>
                <div class="flex justify-between items-center border-t border-gray-800 mt-4 pt-4">
                    <span class="text-gray-300 font-medium">Total a pagar:</span>
                    <span class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">$10.00</span>
                </div>
             </div>

             <!-- Payment Method -->
             <div class="space-y-4 mb-8">
                 <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Método de Pago</p>
                 <button (click)="payWithOxxo()" [disabled]="isProcessingPayment"
                        class="w-full group relative flex items-center justify-between p-4 border border-gray-700 rounded-xl bg-[#0a192f] hover:border-yellow-500/50 hover:bg-yellow-500/5 transition cursor-pointer">
                    <div class="flex items-center gap-4">
                        <div class="bg-white p-2 rounded-lg h-10 w-16 flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/66/Oxxo_Logo.svg" alt="OXXO" class="h-full object-contain">
                        </div>
                        <div class="text-left">
                            <span class="block font-bold text-white group-hover:text-yellow-400 transition">Pago en Efectivo OXXO</span>
                            <span class="text-xs text-gray-500">Genera tu ficha y paga en tienda</span>
                        </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border border-gray-600 group-hover:border-yellow-500 group-hover:bg-yellow-500 transition shadow-[0_0_10px_rgba(234,179,8,0.3)]"></div>
                </button>
             </div>

             <button (click)="payWithOxxo()" [disabled]="isProcessingPayment" class="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold text-lg shadow-lg shadow-orange-500/20 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                <span *ngIf="isProcessingPayment" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                {{ isProcessingPayment ? 'Procesando...' : 'Generar Ficha de Pago' }}
             </button>
             
             <p class="text-center text-[10px] text-gray-600 mt-4">
                Transacción segura procesada por Stripe. Tus datos están protegidos.
            </p>
        </div>

        <!-- STEP 5: SUCCESS (Gold & Clean) -->
        <div *ngIf="step === 'success'" class="w-full max-w-xl bg-[#0f203c] border border-green-500/20 rounded-2xl shadow-2xl p-10 text-center animate-fade-in relative overflow-hidden">
            <div class="absolute top-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500 left-0"></div>
            
            <!-- Success Icon (Only if no error) -->
            <div *ngIf="!error" class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-400 mb-6 ring-1 ring-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <svg *ngIf="!isLoading" class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                <div *ngIf="isLoading" class="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <!-- Error Icon (If error) -->
            <div *ngIf="error" class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 text-red-400 mb-6 ring-1 ring-red-500/30">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
            
            <h1 class="text-3xl font-bold mb-2 text-white">
                <span *ngIf="error">Hubo un problema</span>
                <span *ngIf="!error">{{ isLoading ? 'Finalizando...' : '¡Pago Procesado!' }}</span>
            </h1>
            
            <p *ngIf="isLoading && !error" class="text-blue-400 animate-pulse">Generando tus credenciales de acceso...</p>
            <p *ngIf="!isLoading && !error" class="text-gray-400 mb-8">Tu cuenta ha sido creada exitosamente.</p>
            <p *ngIf="error" class="text-red-300 mb-8">{{ error }}</p>
            
            <div *ngIf="generatedPassword" class="bg-[#0a192f] border border-gray-700 p-6 rounded-xl mb-6 relative group overflow-hidden">
                <div class="absolute top-0 right-0 p-2 opacity-50"><svg class="w-12 h-12 text-gray-800" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg></div>
                
                <p class="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">Tu contraseña de acceso</p>
                <div class="text-3xl font-mono text-white font-bold tracking-widest shadow-black drop-shadow-md select-all cursor-text">{{ generatedPassword }}</div>
                
                <div class="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-center gap-2 text-xs text-yellow-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    <span>Se ha enviado una copia a tu correo: <b>{{displayEmail}}</b></span>
                </div>
            </div>

            <button *ngIf="generatedPassword" (click)="goToLogin()" class="w-full px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg transition">
                Ir a Iniciar Sesión Ahora
            </button>

            <button *ngIf="error" (click)="step = 'form'" class="w-full px-8 py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg shadow-lg transition">
                Volver al Registro
            </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
    .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
    @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class AdminRegisterComponent implements OnInit {
  step: 'landing' | 'info' | 'form' | 'payment' | 'success' = 'landing';
  adminData: any = { fullName: '', email: '', companyName: '' };
  street: string = '';
  error = '';
  isProcessingPayment = false;
  isLoading = false;
  generatedPassword = '';
  displayEmail = '';
  countdown = 10;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }


  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['payment'] === 'success' || params['payment'] === 'mock_success') {
        this.step = 'success';
        this.finalizeRegistration();
      }
    });
  }

  goToLogin() { this.router.navigate(['/login']); }

  goToPayment() {
    if (!this.adminData.fullName || !this.adminData.email || !this.adminData.companyName || !this.street) {
      this.error = "Completa todos los campos"; return;
    }
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('tempAdminData', JSON.stringify({ ...this.adminData, street: this.street }));
    }
    this.step = 'payment';
  }

  payWithOxxo() {
    this.isProcessingPayment = true;
    const paymentPayload = { amountMXN: 10, email: this.adminData.email };
    this.http.post<any>('http://localhost:3000/api/stripe/checkout/oxxo', paymentPayload).subscribe({
      next: (res) => {
        if (res.ok && res.url) {
          if (isPlatformBrowser(this.platformId)) window.location.href = res.url;
        }
      },
      error: (err) => { console.error(err); this.isProcessingPayment = false; }
    });
  }

  finalizeRegistration() {
    if (!isPlatformBrowser(this.platformId)) return;

    const savedData = sessionStorage.getItem('tempAdminData');
    if (!savedData) {
      this.error = "No se encontraron datos de registro. Tu sesión puede haber expirado.";
      return;
    }

    const userData = JSON.parse(savedData);
    this.displayEmail = userData.email;
    this.isLoading = true;

    this.authService.registerAdmin(userData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.generatedPassword = res.password;
        sessionStorage.removeItem('tempAdminData');
      },
      error: (err) => {
        console.error(err);
        this.error = err.error?.message || "Error al crear la cuenta. Intenta con otro correo o contacta soporte.";
        this.isLoading = false;
      }
    });
  }


}
