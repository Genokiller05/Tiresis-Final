import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn: BehaviorSubject<boolean>;

  isLoggedIn$!: Observable<boolean>;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    this.loggedIn = new BehaviorSubject<boolean>(this.hasToken());
    this.isLoggedIn$ = this.loggedIn.asObservable();
  }

  login() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('isLoggedIn', 'true');
    }
    this.loggedIn.next(true);
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('isLoggedIn');
    }
    this.loggedIn.next(false);
  }

  isLoggedIn(): boolean {
    return this.loggedIn.getValue();
  }

  registerAdmin(adminData: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/register-admin', adminData);
  }

  loginAdmin(credentials: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/login', credentials).pipe(
      tap((response: any) => {
        if (response && response.admin) {
          this.setCurrentUser(response.admin);
        }
      })
    );
  }

  private setCurrentUser(user: any) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  getCurrentUser(): any {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  private hasToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('isLoggedIn');
    }
    return false; // Por defecto no logueado en SSR
  }
}