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
        <button (click)="goToLogin()" class="text-gray-400 hover:text-white transition font-medium text-sm border border-transparent hover:border-white/10 px-4 py-2 rounded-lg">
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

        <!-- STEP 2: INFO -->
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
                 
                 <!-- Stats Cards -->
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

        <!-- STEP 3: FORM -->
        <div *ngIf="step === 'form'" class="w-full max-w-lg bg-[#0f203c] border border-blue-500/10 rounded-2xl shadow-2xl p-8 animate-fade-in relative overflow-hidden">
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

        <!-- STEP 4: PAYMENT -->
        <div *ngIf="step === 'payment'" class="w-full max-w-lg bg-[#0f203c] border border-blue-500/10 rounded-2xl shadow-2xl p-8 animate-fade-in relative overflow-hidden">
             <div class="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-bl-full blur-[40px] pointer-events-none"></div>

             <button (click)="backFromPayment()" class="mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm z-10 relative">
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

             <!-- SUB-STEP: SELECT METHOD -->
             <div *ngIf="paymentSubStep === 'select'">
                 <div class="space-y-3 mb-8">
                     <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Método de Pago</p>
                     
                     <!-- Card option -->
                     <button (click)="selectedMethod = 'card'" [disabled]="isProcessingPayment"
                            class="w-full flex items-center justify-between p-4 border rounded-xl bg-[#0a192f] transition cursor-pointer"
                            [ngClass]="selectedMethod === 'card' ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700 hover:border-blue-500/50'">
                        <div class="flex items-center gap-4">
                            <div class="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg h-10 w-16 flex items-center justify-center">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                            </div>
                            <div class="text-left">
                                <span class="block font-bold" [ngClass]="selectedMethod === 'card' ? 'text-blue-400' : 'text-white'">Tarjeta de Crédito / Débito</span>
                                <span class="text-xs text-gray-500">Visa, Mastercard, AMEX</span>
                            </div>
                        </div>
                        <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                             [ngClass]="selectedMethod === 'card' ? 'border-blue-500 bg-blue-500' : 'border-gray-600'">
                            <div *ngIf="selectedMethod === 'card'" class="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                    </button>

                     <!-- OXXO option -->
                     <button (click)="selectedMethod = 'oxxo'" [disabled]="isProcessingPayment"
                            class="w-full flex items-center justify-between p-4 border rounded-xl bg-[#0a192f] transition cursor-pointer"
                            [ngClass]="selectedMethod === 'oxxo' ? 'border-yellow-500 bg-yellow-500/5' : 'border-gray-700 hover:border-yellow-500/50'">
                        <div class="flex items-center gap-4">
                            <div class="bg-white p-2 rounded-lg h-10 w-16 flex items-center justify-center">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/66/Oxxo_Logo.svg" alt="OXXO" class="h-full object-contain">
                            </div>
                            <div class="text-left">
                                <span class="block font-bold" [ngClass]="selectedMethod === 'oxxo' ? 'text-yellow-400' : 'text-white'">Pago en Efectivo OXXO</span>
                                <span class="text-xs text-gray-500">Genera tu ficha y paga en tienda</span>
                            </div>
                        </div>
                        <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                             [ngClass]="selectedMethod === 'oxxo' ? 'border-yellow-500 bg-yellow-500' : 'border-gray-600'">
                            <div *ngIf="selectedMethod === 'oxxo'" class="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                    </button>
                 </div>

                 <button (click)="processPayment()" [disabled]="isProcessingPayment || !selectedMethod"
                        class="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        [ngClass]="{
                          'bg-gradient-to-r from-blue-600 to-indigo-600': selectedMethod === 'card',
                          'bg-gradient-to-r from-yellow-600 to-amber-600': selectedMethod === 'oxxo',
                          'bg-gray-600': !selectedMethod
                        }">
                    <span *ngIf="isProcessingPayment" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    {{ isProcessingPayment ? 'Procesando...' : 'Continuar' }}
                 </button>
             </div>

             <!-- SUB-STEP: CARD FORM (inline Stripe Elements) -->
             <div *ngIf="paymentSubStep === 'card-form'">
                 <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">Ingresa los datos de tu tarjeta</p>
                 <div class="bg-[#0a192f] border border-gray-700 rounded-xl p-6 mb-4">
                     <div id="card-element" class="p-3 bg-white/5 rounded-lg border border-gray-600 min-h-[44px]"></div>
                     <div *ngIf="cardError" class="mt-3 text-red-400 text-sm flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {{ cardError }}
                     </div>
                 </div>
                 <button (click)="confirmCardPayment()" [disabled]="isProcessingPayment"
                        class="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
                    <span *ngIf="isProcessingPayment" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    {{ isProcessingPayment ? 'Procesando pago...' : 'Pagar $10.00 MXN' }}
                 </button>
                 <p class="text-center text-[10px] text-gray-600 mt-4 flex items-center justify-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Transacción segura con Stripe. Tus datos están protegidos.
                </p>
             </div>

             <!-- SUB-STEP: OXXO VOUCHER (inline) -->
             <div *ngIf="paymentSubStep === 'oxxo-voucher'">
                 <div id="oxxo-voucher-content" class="bg-white rounded-xl p-6 mb-6 text-gray-900">
                     <div class="flex items-center justify-between mb-4">
                         <img src="https://upload.wikimedia.org/wikipedia/commons/6/66/Oxxo_Logo.svg" alt="OXXO" class="h-10">
                         <span class="text-sm text-gray-500">Ficha de pago</span>
                     </div>
                     <div class="text-center mb-4">
                         <p class="text-2xl font-bold text-gray-900">MXN $10.00</p>
                         <p class="text-sm text-gray-500 mt-1">Vence el {{ oxxoExpiresAt }}</p>
                     </div>
                     <div class="border-t border-b border-gray-300 py-4 my-4 text-center">
                         <div class="flex justify-center mb-2">
                             <svg class="w-64 h-16" viewBox="0 0 256 64">
                                 <rect *ngFor="let bar of barcodeBars; let i = index" [attr.x]="i * 2" y="0" [attr.width]="bar" height="56" fill="black"/>
                             </svg>
                         </div>
                         <p class="text-lg font-mono font-bold tracking-[0.3em] text-gray-900">{{ oxxoReference }}</p>
                     </div>
                     <div class="text-left text-sm text-gray-700 space-y-2">
                         <p class="font-bold">Instrucciones para pagar con OXXO:</p>
                         <p>1. Entrega el vale al cajero para que escanee el código de barras.</p>
                         <p>2. Proporciona el pago en efectivo al cajero.</p>
                         <p>3. Una vez hecho el pago, guarda el recibo para tus registros.</p>
                     </div>
                 </div>
                 <div class="flex gap-3">
                     <button (click)="downloadOxxoVoucher()" class="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-bold shadow-lg transition flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Descargar Ficha
                     </button>
                     <button (click)="downloadOxxoVoucher()" class="px-4 py-3 rounded-xl border border-gray-600 hover:bg-white/5 text-gray-300 font-bold transition flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Imprimir
                     </button>
                 </div>
                 <p class="text-center text-xs text-gray-500 mt-4">Tu cuenta se activará cuando OXXO confirme el pago (1-24 hrs).</p>
             </div>

             <p *ngIf="paymentSubStep === 'select'" class="text-center text-[10px] text-gray-600 mt-4 flex items-center justify-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Transacción segura. Tus datos están protegidos.
            </p>
        </div>

        <!-- STEP 5: SUCCESS -->
        <div *ngIf="step === 'success'" class="w-full max-w-xl bg-[#0f203c] border border-green-500/20 rounded-2xl shadow-2xl p-10 text-center animate-fade-in relative overflow-hidden">
            <div class="absolute top-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500 left-0"></div>
            
            <div *ngIf="!error" class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-400 mb-6 ring-1 ring-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <svg *ngIf="!isLoading" class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                <div *ngIf="isLoading" class="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>

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
                <p class="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">Tu contraseña de acceso</p>
                <div class="text-3xl font-mono text-white font-bold tracking-widest select-all cursor-text">{{ generatedPassword }}</div>
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
    paymentSubStep: 'select' | 'card-form' | 'oxxo-voucher' = 'select';
    adminData: any = { fullName: '', email: '', companyName: '' };
    street: string = '';
    error = '';
    cardError = '';
    selectedMethod: 'card' | 'oxxo' | '' = 'card';
    isProcessingPayment = false;
    isLoading = false;
    generatedPassword = '';
    displayEmail = '';
    countdown = 10;

    // Stripe
    private stripeInstance: any = null;
    private cardElement: any = null;
    private clientSecret: string = '';

    // OXXO voucher
    oxxoReference: string = '';
    oxxoExpiresAt: string = '';
    barcodeBars: number[] = [];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private http: HttpClient,
        private cdr: ChangeDetectorRef,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['payment'] === 'success') {
                this.step = 'success';
                this.finalizeRegistration();
            } else if (params['action'] === 'register') {
                this.step = 'form';
            }
        });
        // Initialize Stripe.js
        if (isPlatformBrowser(this.platformId)) {
            this.http.get<any>('http://localhost:3000/api/stripe/config').subscribe({
                next: (res) => {
                    if (res.publishableKey && (window as any).Stripe) {
                        this.stripeInstance = (window as any).Stripe(res.publishableKey);
                    }
                },
                error: () => console.warn('Could not load Stripe config')
            });
        }
    }

    goToLogin() { this.router.navigate(['/login']); }

    backFromPayment() {
        if (this.paymentSubStep !== 'select') {
            this.paymentSubStep = 'select';
            this.cardError = '';
        } else {
            this.step = 'form';
        }
    }

    goToPayment() {
        if (!this.adminData.fullName || !this.adminData.email || !this.adminData.companyName || !this.street) {
            this.error = "Completa todos los campos"; return;
        }
        this.error = '';
        if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('tempAdminData', JSON.stringify({ ...this.adminData, street: this.street }));
        }
        this.paymentSubStep = 'select';
        this.step = 'payment';
    }

    processPayment() {
        if (this.selectedMethod === 'card') this.initCardForm();
        else if (this.selectedMethod === 'oxxo') this.initOxxoPayment();
    }

    // --- CARD: Inline Stripe Elements ---
    initCardForm() {
        this.isProcessingPayment = true;
        this.cardError = '';
        const payload = { amountMXN: 10, email: this.adminData.email };

        this.http.post<any>('http://localhost:3000/api/stripe/create-payment-intent', payload).subscribe({
            next: (res) => {
                this.clientSecret = res.clientSecret;
                this.isProcessingPayment = false;
                this.paymentSubStep = 'card-form';
                this.cdr.detectChanges();
                setTimeout(() => this.mountCardElement(), 150);
            },
            error: (err) => {
                this.isProcessingPayment = false;
                this.cardError = err.error?.message || 'Error al preparar el pago';
            }
        });
    }

    mountCardElement() {
        if (!this.stripeInstance) { this.cardError = 'Stripe no se ha cargado. Recarga la página.'; return; }
        const elements = this.stripeInstance.elements();
        this.cardElement = elements.create('card', {
            style: {
                base: { color: '#ffffff', fontFamily: 'Inter, sans-serif', fontSize: '16px', '::placeholder': { color: '#6b7280' } },
                invalid: { color: '#ef4444' }
            }
        });
        const container = document.getElementById('card-element');
        if (container) { container.innerHTML = ''; this.cardElement.mount('#card-element'); }
    }

    async confirmCardPayment() {
        if (!this.stripeInstance || !this.cardElement || !this.clientSecret) return;
        this.isProcessingPayment = true;
        this.cardError = '';

        const { error, paymentIntent } = await this.stripeInstance.confirmCardPayment(this.clientSecret, {
            payment_method: { card: this.cardElement }
        });

        if (error) {
            this.cardError = error.message || 'Error al procesar el pago';
            this.isProcessingPayment = false;
            this.cdr.detectChanges();
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            this.isProcessingPayment = false;
            this.step = 'success';
            this.cdr.detectChanges();
            this.finalizeRegistration();
        }
    }

    // --- OXXO: Server-side confirmation, display voucher inline ---
    initOxxoPayment() {
        this.isProcessingPayment = true;
        this.error = '';
        const payload = { amountMXN: 10, email: this.adminData.email, name: this.adminData.fullName };

        this.http.post<any>('http://localhost:3000/api/stripe/create-oxxo-payment', payload).subscribe({
            next: (res) => {
                this.isProcessingPayment = false;
                // Backend ya confirmó el pago y devolvió datos del voucher
                this.oxxoReference = res.reference || 'N/A';
                const expDate = new Date(res.expiresAt * 1000);
                this.oxxoExpiresAt = expDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
                this.generateBarcode();
                this.paymentSubStep = 'oxxo-voucher';
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isProcessingPayment = false;
                this.error = err.error?.message || 'Error al crear pago OXXO';
                this.cdr.detectChanges();
            }
        });
    }

    generateBarcode() {
        this.barcodeBars = [];
        for (let i = 0; i < 128; i++) {
            this.barcodeBars.push(Math.random() > 0.5 ? 1.5 : 0.5);
        }
    }

    downloadOxxoVoucher() {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html><head><title>Ficha OXXO - TIRESIS</title>
            <style>body{font-family:Arial,sans-serif;padding:40px;max-width:500px;margin:0 auto;}
            .title{text-align:center;font-size:22px;font-weight:bold;margin-bottom:20px;}
            .ref{text-align:center;font-size:24px;font-weight:bold;letter-spacing:4px;margin:20px 0;padding:15px;border-top:2px solid #ccc;border-bottom:2px solid #ccc;}
            .amount{text-align:center;font-size:28px;font-weight:bold;} .expires{text-align:center;color:#666;margin-bottom:20px;}
            .instructions p{margin:8px 0;} hr{margin:20px 0;} .footer{text-align:center;color:#999;margin-top:30px;font-size:12px;}
            </style></head><body>
            <div class="title">OXXO - Ficha de Pago</div>
            <div class="amount">MXN $10.00</div>
            <div class="expires">Vence el ${this.oxxoExpiresAt}</div>
            <div class="ref">${this.oxxoReference}</div>
            <div class="instructions">
                <p><b>Instrucciones:</b></p>
                <p>1. Entrega el vale al cajero para que escanee el código.</p>
                <p>2. Proporciona el pago en efectivo al cajero.</p>
                <p>3. Guarda el recibo para tus registros.</p>
            </div>
            <div class="footer">TIRESIS - Sistema de Seguridad</div>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // --- FINALIZE REGISTRATION ---
    finalizeRegistration() {
        if (!isPlatformBrowser(this.platformId)) return;

        const savedData = sessionStorage.getItem('tempAdminData');
        if (!savedData) {
            this.error = "Sesión expirada o datos perdidos. Por favor intenta registrarte nuevamente.";
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
                this.error = err.error?.message || "Error al crear la cuenta. Intenta con otro correo o contacta soporte.";
                this.isLoading = false;
            }
        });
    }
}
