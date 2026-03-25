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
    <div class="min-h-screen text-gray-100 flex flex-col font-sans relative overflow-x-hidden bg-transparent">
      
      <!-- Background Layer (Base) -->
      <div class="fixed top-0 left-0 w-full h-full bg-[#081121] z-[-4] pointer-events-none"></div>

      <!-- Background Image -->
      <div class="fixed top-0 left-0 w-full h-full z-[-3] pointer-events-none">
          <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" 
               class="w-full h-full object-cover opacity-30" alt="Security Background">
      </div>
      
      <!-- Overlays -->
      <div class="fixed top-0 left-0 w-full h-full bg-gradient-to-b from-[#081121]/40 to-[#081121]/90 z-[-2] pointer-events-none"></div>
      <div class="fixed top-0 left-0 w-full h-full z-[-2] opacity-10 pointer-events-none" 
           style="background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 50px 50px;">
      </div>
      
      <div class="fixed top-[-100px] left-[-100px] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-[-1]"></div>
      <div class="fixed bottom-[-100px] right-[-100px] w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none z-[-1]"></div>

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
        <div *ngIf="step === 'landing'" class="flex flex-col items-center justify-center text-center animate-fade-in-up py-10">
            
            <!-- Badge -->
            <div class="mb-8 px-5 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                Nueva Plataforma de Seguridad 2026
            </div>

            <h1 class="text-6xl md:text-8xl font-extrabold mb-8 text-white leading-tight tracking-tight">
                Vigilancia Inteligente <br> 
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 drop-shadow-[0_0_25px_rgba(56,189,248,0.3)]">
                   en Tiempo Real
                </span>
            </h1>
            
            <p class="text-xl md:text-2xl text-gray-400 mb-14 max-w-3xl mx-auto leading-relaxed font-light">
                Sistema operativo integral para <strong class="text-white font-medium">residenciales y empresas</strong>. Controla accesos, monitorea guardias y genera reportes en segundos.
            </p>

            <div class="flex flex-col sm:flex-row gap-8 justify-center w-full max-w-3xl px-4">
                <button (click)="step = 'info'" class="flex-1 py-6 rounded-2xl bg-white/5 border border-white/10 text-gray-200 font-semibold transition backdrop-blur-md hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 flex items-center justify-center gap-4 text-2xl shadow-lg">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    Leer más
                </button>
                <button (click)="step = 'form'" class="flex-1 py-6 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white font-bold shadow-[0_20px_50px_rgba(37,99,235,0.4)] transition hover:from-blue-500 hover:to-indigo-500 hover:-translate-y-1.5 hover:scale-[1.03] flex items-center justify-center gap-4 text-2xl group">
                    Registrar empresa
                    <svg class="w-7 h-7 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                </button>
            </div>

        </div>

        <!-- STEP 2: INFO -->
        <div *ngIf="step === 'info'" class="max-w-6xl w-full animate-fade-in p-4 mt-8 pb-16">
             <button (click)="step = 'landing'" class="mb-8 text-gray-400 hover:text-white flex items-center gap-2 transition text-sm cursor-pointer hover:-translate-x-1 transform duration-200">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 Volver
             </button>

             <div class="text-center mb-10">
                <h2 class="text-3xl md:text-4xl font-bold text-white mb-3">Qué hace <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">TIRESIS</span></h2>
                <p class="text-gray-400 max-w-2xl mx-auto">Sistema integral que une a los guardias en campo con los administradores en una sola plataforma en la nube. Reportes rápidos, bitácoras digitales y mapas interactivos.</p>
            </div>

            <!-- 4 CARACTERÍSTICAS (Grid) -->
            <div class="grid md:grid-cols-2 gap-6 mb-12 max-w-5xl mx-auto">
                <div class="bg-[#112240]/50 p-8 rounded-2xl border border-blue-500/10 flex items-start gap-6 hover:bg-[#112240]/70 transition-all duration-300">
                    <div class="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    </div>
                    <div>
                        <h3 class="text-white text-xl font-bold mb-3">App Móvil para Guardias</h3>
                        <p class="text-gray-400 text-base leading-relaxed">Reportan incidencias desde su celular en 30-60 segundos. Adjuntan fotos, videos y notas de voz al instante, optimizando el trabajo en campo.</p>
                    </div>
                </div>
                
                <div class="bg-[#112240]/50 p-8 rounded-2xl border border-emerald-500/10 flex items-start gap-6 hover:bg-[#112240]/70 transition-all duration-300">
                    <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                    </div>
                    <div>
                        <h3 class="text-white text-xl font-bold mb-3">Mapeo Satelital Interactivo</h3>
                        <p class="text-gray-400 text-base leading-relaxed">Dibuja tu fraccionamiento o empresa. Observa en tiempo real dónde ocurren las incidencias y visualiza puntos de control y estructuras.</p>
                    </div>
                </div>

                <div class="bg-[#112240]/50 p-8 rounded-2xl border border-amber-500/10 flex items-start gap-6 hover:bg-[#112240]/70 transition-all duration-300">
                    <div class="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div>
                        <h3 class="text-white text-xl font-bold mb-3">Control y Bitácoras Digitales</h3>
                        <p class="text-gray-400 text-base leading-relaxed">Olvida las libretas de papel. Registra visitantes, proveedores, vehículos y novedades de turnos de forma rápida, segura y 100% auditable.</p>
                    </div>
                </div>

                <div class="bg-[#112240]/50 p-8 rounded-2xl border border-blue-500/10 flex items-start gap-6 hover:bg-[#112240]/70 transition-all duration-300">
                    <div class="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div>
                        <h3 class="text-white text-xl font-bold mb-3">Dashboard Administrativo</h3>
                        <p class="text-gray-400 text-base leading-relaxed">Los administradores visualizan todo 24/7 y exportan reportes formales en PDF o Excel (con logo de empresa) para aseguradoras o condóminos.</p>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN DE PLANES PREVIA (Información) -->
            <div class="mt-16 mb-12 animate-fade-in" style="animation-delay: 0.2s">
                <div class="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-12 opacity-30"></div>
                <h3 class="text-3xl font-bold text-center text-white mb-10">Planes diseñados para tu Seguridad</h3>
                
                <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
                    <!-- MINI-TARJETA BÁSICA -->
                    <div class="pricing-card basic !p-7 border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 transition-all duration-300">
                        <div class="text-lg font-semibold text-blue-400 mb-1">Plan Básico</div>
                        <div class="text-4xl font-bold text-white mb-4">$10 <span class="text-sm font-normal text-gray-400">MXN / mes</span></div>
                        <ul class="text-xs text-gray-400 space-y-3 mb-0">
                            <li class="flex items-start gap-2"><svg class="w-4 h-4 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span>Hasta 2 guardias vinculados al sitio</span></li>
                            <li class="flex items-start gap-2"><svg class="w-4 h-4 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span>Reportes digitales con marca de agua</span></li>
                            <li class="flex items-start gap-2"><svg class="w-4 h-4 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span>Historial de incidencias de 15 días</span></li>
                        </ul>
                    </div>

                    <!-- MINI-TARJETA PREMIUM -->
                    <div class="pricing-card premium !p-7 scale-105 border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                        <div class="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Más Popular</div>
                        <div class="text-lg font-semibold text-emerald-400 mb-1">Plan Premium</div>
                        <div class="text-4xl font-bold text-white mb-4">$15 <span class="text-sm font-normal text-gray-400">MXN / mes</span></div>
                        <ul class="text-xs text-gray-400 space-y-3 mb-0">
                            <li class="flex items-start gap-2"><svg class="w-4 h-4 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span>Guardias y Usuarios Ilimitados</span></li>
                            <li class="flex items-start gap-2"><svg class="w-4 h-4 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span>Marca Blanca (Usa tu propio Logo)</span></li>
                            <li class="flex items-start gap-2"><svg class="w-4 h-4 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span>Evidencia de Video y Reportes PDF/Excel</span></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="mt-8 flex justify-center">
                <button (click)="step = 'form'" class="px-12 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold text-xl shadow-xl hover:scale-105 transition transform">
                   Comenzar Registro Gratis
                </button>
            </div>
        </div>

        <!-- STEP 3: FORM (Datos de Empresa) -->
        <div *ngIf="step === 'form'" class="w-full max-w-lg bg-[#0f203c] border border-blue-500/10 rounded-2xl shadow-2xl p-8 animate-fade-in relative overflow-hidden">
             <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

             <button (click)="step = 'landing'" class="mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 Volver
             </button>
             
             <h2 class="text-2xl font-bold mb-2 text-white">Registro de Empresa</h2>
             <p class="text-gray-400 text-sm mb-6">Paso 1: Configura tu cuenta de administrador.</p>

             <form (ngSubmit)="goToPlans()" class="space-y-4">
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

                 <button type="submit" class="w-full mt-4 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                     Continuar a Planes
                     <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                 </button>
             </form>
        </div>

        <!-- STEP 4: SELECCIÓN DE PLAN -->
        <div *ngIf="step === 'plans'" class="max-w-6xl w-full animate-fade-in p-4 mt-8 pb-16">
             <button (click)="step = 'form'" class="mb-8 text-gray-400 hover:text-white flex items-center gap-2 transition text-sm cursor-pointer">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 Cambiar mis datos
             </button>

             <div class="text-center mb-10">
                <h2 class="text-3xl md:text-4xl font-bold text-white mb-3">Elige tu Plan de Protección</h2>
                <p class="text-gray-400">Paso 2: Selecciona el nivel de seguridad que tu empresa necesita.</p>
            </div>

            <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <!-- TARJETA BÁSICA -->
                <div class="pricing-card basic">
                    <div class="text-xl font-semibold text-blue-400 mb-2">Básico / Demo</div>
                    <div class="text-4xl font-extrabold text-white mb-2 flex items-baseline">
                        $10 <span class="text-sm font-normal text-gray-400 ml-2">MXN / mes</span>
                    </div>
                    <p class="text-gray-400 text-sm mb-6 pb-6 border-b border-gray-700/50">Ideal para conocer el sistema o sitios con pocos requerimientos.</p>
                    
                    <div class="flex-grow">
                        <div class="feature-item">
                            <svg class="feature-icon" stroke="#3b82f6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <span class="text-white">Hasta 2 guardias y reportes con marca de agua</span>
                        </div>
                        <div class="feature-item">
                            <svg class="feature-icon" stroke="#3b82f6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <span class="text-white">1 fotografía por reporte (sin video)</span>
                        </div>
                        <div class="feature-item mb-4">
                            <svg class="feature-icon" stroke="#3b82f6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <span class="text-white">Retención de historial de 15 días</span>
                        </div>
                        
                        <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">NO INCLUYE:</div>
                        <div class="feature-item disabled">
                            <svg class="feature-icon" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            Marca Blanca y exportación a Excel/PDF
                        </div>
                    </div>

                    <div class="mt-6">
                        <button (click)="selectPlan('Básico', 10)" class="w-full glow-btn-basic text-white py-4 px-4 rounded-xl font-bold text-lg cursor-pointer">
                            Seleccionar Básico
                        </button>
                    </div>
                </div>

                <!-- TARJETA PREMIUM -->
                <div class="pricing-card premium scale-105 border-2">
                    <div class="absolute -top-3 right-6 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg">Recomendado</div>
                    
                    <div class="text-xl font-semibold text-emerald-400 mb-2">Premium</div>
                    <div class="text-4xl font-extrabold text-white mb-2 flex items-baseline">
                        $15 <span class="text-sm font-normal text-gray-400 ml-2">MXN / mes</span>
                    </div>
                    <p class="text-gray-400 text-sm mb-6 pb-6 border-b border-gray-700/50">Control total, auditorías y evidencia multimedia ilimitada.</p>
                    
                    <div class="flex-grow">
                        <div class="feature-item">
                            <svg class="feature-icon" stroke="#10b981" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <span class="text-white">Guardias y usuarios <strong class="text-emerald-400 font-medium">ilimitados</strong></span>
                        </div>
                        <div class="feature-item">
                            <svg class="feature-icon" stroke="#10b981" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <span class="text-white">Evidencia extra: <strong class="text-emerald-400 font-medium">5 fotos y 1 video</strong></span>
                        </div>
                        <div class="feature-item">
                            <svg class="feature-icon" stroke="#10b981" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <span class="text-white">Exportación formal: <strong class="text-emerald-400 font-medium">Excel y PDF con tu Logo</strong></span>
                        </div>
                        <div class="feature-item">
                            <svg class="feature-icon" stroke="#10b981" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <span class="text-white">Retención de historial: <strong class="text-emerald-400 font-medium">1 año completo</strong></span>
                        </div>
                    </div>

                    <div class="mt-6">
                        <button (click)="selectPlan('Premium', 15)" class="w-full glow-btn text-white py-4 px-4 rounded-xl font-bold text-lg cursor-pointer">
                            Activar Premium con 30 Días Gratis
                        </button>
                        <p class="text-center text-xs text-gray-500 mt-3">Sin compromiso. Cancela cuando quieras.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- STEP 5: PAYMENT -->
        <div *ngIf="step === 'payment'" class="w-full max-w-lg bg-[#0f203c] border border-blue-500/10 rounded-2xl shadow-2xl p-8 animate-fade-in relative overflow-hidden">
             <div class="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-bl-full blur-[40px] pointer-events-none"></div>

             <button (click)="step = 'plans'" class="mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm z-10 relative">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 Elegir otro plan
             </button>
             
             <div class="text-center mb-8">
                <h2 class="text-3xl font-bold mb-1 text-white">Activar Cuenta</h2>
                <p class="text-blue-300/80 text-sm font-semibold uppercase tracking-widest">Plan {{ selectedPlan.name }}</p>
             </div>

             <!-- Price Card -->
             <div class="bg-[#0a192f] border border-blue-500/20 rounded-xl p-6 mb-8 shadow-inner">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-gray-400 text-sm">Mensualidad del plan</span>
                    <span class="text-white font-bold text-xl">$ {{ selectedPlan.price }}.00 MXN</span>
                </div>
                <div class="flex justify-between items-center border-t border-gray-800 mt-4 pt-4">
                    <span class="text-gray-300 font-medium">Total a pagar ahora:</span>
                    <span class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">$ {{ selectedPlan.price }}.00</span>
                </div>
                <p *ngIf="selectedPlan.name === 'Premium'" class="mt-4 text-xs text-emerald-400 text-center font-bold">
                   Tu primer mes es totalmente GRATIS. No se te cobrará nada hoy.
                </p>
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

                 <div *ngIf="cardError" class="mb-4 p-3 bg-red-900/20 border border-red-500/20 rounded text-red-300 text-xs flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {{ cardError }}
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
                    {{ isProcessingPayment ? 'Procesando pago...' : 'Pagar $' + selectedPlan.price + '.00 MXN' }}
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

    .pricing-card {
        background: rgba(20, 27, 45, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 2rem;
        backdrop-filter: blur(12px);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .pricing-card:hover { transform: translateY(-5px); }
    .pricing-card.premium {
        border-color: rgba(16, 185, 129, 0.4);
        box-shadow: 0 0 35px rgba(16, 185, 129, 0.15);
    }
    .pricing-card.basic {
        border-color: rgba(59, 130, 246, 0.4);
        box-shadow: 0 0 35px rgba(59, 130, 246, 0.15);
    }

    .feature-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 0.8rem;
        font-size: 0.9rem;
        color: #cbd5e1;
    }

    .feature-item.disabled {
        color: #475569;
        text-decoration: line-through;
    }

    .feature-icon {
        width: 18px;
        height: 18px;
        margin-right: 10px;
        flex-shrink: 0;
        margin-top: 2px;
    }

    .glow-btn {
        background: linear-gradient(135deg, #10b981, #059669);
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        transition: all 0.2s ease;
    }
    .glow-btn:hover {
        transform: scale(1.02);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
    }

    .glow-btn-basic {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        transition: all 0.2s ease;
    }
    .glow-btn-basic:hover {
        transform: scale(1.02);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
    }
  `]
})
export class AdminRegisterComponent implements OnInit {
    step: 'landing' | 'info' | 'form' | 'plans' | 'payment' | 'success' = 'landing';
    paymentSubStep: 'select' | 'card-form' | 'oxxo-voucher' = 'select';
    adminData: any = { fullName: '', email: '', companyName: '' };
    selectedPlan: { name: string, price: number } = { name: 'Premium', price: 15 };
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
        // Precargar datos si el usuario ya está autenticado (Flujo Upgrade)
        if (isPlatformBrowser(this.platformId)) {
            const currentUser = this.authService.getCurrentUser();
            if (currentUser) {
                this.adminData = {
                    fullName: currentUser.fullName || currentUser.name || '',
                    email: currentUser.email || '',
                    companyName: currentUser.companyName || ''
                };
                this.street = currentUser.location || '';
                this.displayEmail = currentUser.email || '';
            }
        }

        this.route.queryParams.subscribe(params => {
            if (params['payment'] === 'success') {
                this.step = 'success';
                this.finalizeRegistration();
            } else if (params['action'] === 'register') {
                // Si ya tenemos datos (Upgrade), podemos ir directo a planes si se especifica
                if (params['step'] === 'plans' && this.adminData.email) {
                    this.step = 'plans';
                } else {
                    this.step = 'form';
                }
            }
        });

    }

    private loadStripeScript(): Promise<boolean> {
        return new Promise((resolve) => {
            if ((window as any).Stripe) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => {
                console.error('Error al cargar Stripe.js');
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }

    private async ensureStripeLoaded(): Promise<boolean> {
        if (!isPlatformBrowser(this.platformId)) return false;
        if (this.stripeInstance) return true;

        const scriptLoaded = await this.loadStripeScript();
        if (!scriptLoaded || !(window as any).Stripe) return false;

        return await new Promise((resolve) => {
            this.http.get<any>('http://localhost:3000/api/stripe/config').subscribe({
                next: (res) => {
                    if (res.publishableKey) {
                        this.stripeInstance = (window as any).Stripe(res.publishableKey);
                        resolve(!!this.stripeInstance);
                        return;
                    }
                    console.warn('Stripe publishable key no disponible');
                    resolve(false);
                },
                error: () => {
                    console.warn('Could not load Stripe config');
                    resolve(false);
                }
            });
        });
    }

    goToLogin() { this.router.navigate(['/login']); }

    backFromPayment() {
        if (this.paymentSubStep !== 'select') {
            this.paymentSubStep = 'select';
            this.cardError = '';
        } else {
            // Si es un upgrade (ya logueado), volver al perfil o a planes
            const currentUser = this.authService.getCurrentUser();
            if (currentUser) {
                this.step = 'plans';
            } else {
                this.step = 'form';
            }
        }
    }

    goToPlans() {
        if (!this.adminData.fullName || !this.adminData.email || !this.adminData.companyName || !this.street) {
            this.error = "Completa todos los campos"; return;
        }
        this.error = '';
        this.step = 'plans';
    }

    selectPlan(name: string, price: number) {
        this.selectedPlan = { name, price };
        if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('tempAdminData', JSON.stringify({ 
                ...this.adminData, 
                street: this.street,
                plan: name,
                amount: price
            }));
        }
        this.paymentSubStep = 'select';
        this.step = 'payment';
    }

    processPayment() {
        if (this.selectedMethod === 'card') this.initCardForm();
        else if (this.selectedMethod === 'oxxo') this.initOxxoPayment();
    }

    // --- CARD: Inline Stripe Elements ---
    async initCardForm() {
        this.isProcessingPayment = true;
        this.cardError = '';
        const stripeReady = await this.ensureStripeLoaded();
        if (!stripeReady) {
            this.isProcessingPayment = false;
            this.cardError = 'Stripe no pudo cargarse en este navegador.';
            return;
        }
        const payload = { amountMXN: this.selectedPlan.price, email: this.adminData.email };

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
        const payload = { amountMXN: this.selectedPlan.price, email: this.adminData.email, name: this.adminData.fullName };

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
            <div class="amount">MXN $${this.selectedPlan.price}.00</div>
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

        // Si el usuario ya está logueado, es un Upgrade, no un registro nuevo.
        const currentUser = this.authService.getCurrentUser();
        
        if (currentUser && currentUser.email === userData.email) {
            // Lógica de UPGRADE para usuario existente
            this.http.post<any>('http://localhost:3000/api/upgrade-admin-plan', { 
                email: userData.email, 
                plan: userData.plan 
            }).subscribe({
                next: (res) => {
                    this.isLoading = false;
                    // Actualizar el plan en el usuario local
                    const updatedUser = { ...currentUser, plan: userData.plan };
                    this.authService.setCurrentUser(updatedUser);
                    sessionStorage.removeItem('tempAdminData');
                },
                error: (err) => {
                    this.error = err.error?.message || "Error al activar el plan Premium. Por favor contacta soporte.";
                    this.isLoading = false;
                }
            });
        } else {
            // Lógica de REGISTRO NUEVO
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
}
