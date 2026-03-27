import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private loggedIn: BehaviorSubject<boolean>;

  isLoggedIn$!: Observable<boolean>;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    this.loggedIn = new BehaviorSubject<boolean>(this.hasToken());
    this.isLoggedIn$ = this.loggedIn.asObservable();
  }

  hasToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('isLoggedIn') === 'true';
    }
    return false;
  }

  // Set internal state to true
  login() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('isLoggedIn', 'true');
    }
    this.loggedIn.next(true);
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('currentUser');
    }
    this.loggedIn.next(false);
  }

  isLoggedIn(): boolean {
    // Check subject first, but fallback to storage if false (handle refresh)
    if (this.loggedIn.getValue()) return true;
    return this.hasToken();
  }

  registerAdmin(adminData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-admin`, adminData);
  }

  loginAdmin(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response && response.admin) {
          this.setCurrentUser(response.admin);
          this.login(); // Auto set loggedIn state
        }
      })
    );
  }

  setCurrentUser(user: any) {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  getCurrentUser(): any {
    if (isPlatformBrowser(this.platformId)) {
      const user = sessionStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  /**
   * Obtiene el ID del admin autenticado.
   * Este ID se usa como x-admin-id en el interceptor HTTP.
   */
  getAdminId(): string | null {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  isPremium(): boolean {
    const user = this.getCurrentUser();
    return user && user.plan === 'Premium';
  }
}
