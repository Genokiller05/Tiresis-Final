import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  isLoading = false;

  constructor(private router: Router, private authService: AuthService) { }

  login() {
    // Validar que los campos no estén vacíos
    if (!this.email || !this.password) {
      this.error = 'Por favor, completa todos los campos.';
      return;
    }

    // Trim de espacios en blanco
    const email = this.email.trim();
    const password = this.password.trim();

    // Validar formato básico de email
    if (!this.isValidEmail(email)) {
      this.error = 'Por favor, ingresa un correo electrónico válido.';
      return;
    }

    // Validar credenciales
    this.isLoading = true;
    this.authService.loginAdmin({ email, password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.authService.login(); // Mantener estado de sesión en frontend
        this.router.navigate(['/alertas']);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Credenciales incorrectas. Por favor, inténtalo de nuevo.';
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
