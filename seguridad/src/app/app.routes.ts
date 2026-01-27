import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AlertasComponent } from './components/alertas/alertas.component';
import { RegistrosComponent } from './components/registros/registros.component';
import { AdminProfileComponent } from './components/admin-profile/admin-profile.component';
import { MapaComponent } from './components/mapa/mapa.component';
import { EntradasSalidasComponent } from './components/entradas-salidas/entradas-salidas.component';
import { CamarasComponent } from './components/camaras/camaras.component';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { authGuard } from './guards/auth-guard';

import { AdminRegisterComponent } from './components/admin-register/admin-register.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: AdminRegisterComponent },
    { path: '', redirectTo: 'register', pathMatch: 'full' },
    {
        path: 'dashboard', // Moved Layout to explicit path
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'alertas', pathMatch: 'full' },
            { path: 'alertas', component: AlertasComponent },
            { path: 'registros', component: RegistrosComponent },
            { path: 'home', component: HomeComponent },
            { path: 'admin-profile', component: AdminProfileComponent },
            { path: 'mapa', component: MapaComponent },
            { path: 'entradas-salidas', component: EntradasSalidasComponent },
            { path: 'camaras', component: CamarasComponent }
        ]
    },
    { path: '**', redirectTo: 'register' }
];
