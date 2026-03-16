import { Observable } from 'rxjs';
import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { JsonStorageService } from './services/json-storage.service';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngIf

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('seguridad');
  isLoggedIn$!: Observable<boolean>; // Declarar pero asignar en el constructor

  constructor(
    private themeService: ThemeService,
    private jsonStorageService: JsonStorageService,
    private authService: AuthService
  ) {
    console.error('%c🚀 TIRESIS V3 - SISTEMA SINCRONIZADO', 'background: #00ffff; color: #000; font-size: 20px; font-weight: bold; padding: 10px;');
    this.isLoggedIn$ = this.authService.isLoggedIn$; // Asignar aquí
  }

  ngOnInit(): void {
    this.themeService.initTheme();
    this.jsonStorageService.initDefaultData(); // Inicializar datos por defecto
  }
}
