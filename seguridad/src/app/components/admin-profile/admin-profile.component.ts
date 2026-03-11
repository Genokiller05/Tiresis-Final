import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.css']
})
export class AdminProfileComponent implements OnInit, OnDestroy {

  // State management properties
  public isEditingProfile: boolean = false;

  // Form data models
  public adminName: string = 'Administrator Name';
  public adminPhone: string = '+1 (555) 123-4567';
  public profileImageUrl: string = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQmWUv9sstTOZeCdKbqAGq4-uBgDkOTEF0cDZJNbvJ_j_lXk18EZLWH7xcFdqcb0ragF6cJdZD2pQuN2RUHqKLGXJEADyujxtP9UGnYVcmZNYi-UlT9KNYYEjhei64yx9RytYpTHNSbt_-XcAoqmyS0LcJzsNb3_fFph10xLsDaE2jw7C5FjHnTwVs71Hjv6Vm66jUWKq4f3C4Z7a-uafFkpjAKfyUhgYmpQfoiQLSo4ASQkUmaWtDW3JtKZUU9u_JRzfUAUvMk7ah';
  public adminEmail: string = '';
  public companyName: string = '';
  public location: string = '';
  public lastLoginDate: string | null = null;

  // Weekly report
  public weekNumber: number = 0;
  public weekDateRange: string = '';

  // Modals
  public isSuccessModalVisible: boolean = false;
  public isLogoutConfirmationVisible: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.loadProfile();
    this.calculateCurrentWeek();
  }

  ngOnDestroy(): void {
  }

  private loadProfile(): void {
    if (isPlatformBrowser(this.platformId)) {
      const currentUser = this.authService.getCurrentUser();
      const savedProfile = localStorage.getItem('adminProfile');

      if (currentUser) {
        this.adminName = currentUser.fullName || currentUser.name || this.adminName;
        this.adminEmail = currentUser.email || this.adminEmail;
        this.companyName = currentUser.companyName || 'Sin Compañía';
        this.location = currentUser.location || 'Sin Ubicación';
      }

      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        this.adminName = profile.name || this.adminName;
        this.adminPhone = profile.phone || this.adminPhone;
        this.profileImageUrl = profile.imageUrl || this.profileImageUrl;
        if (profile.companyName) this.companyName = profile.companyName;
        if (profile.location) this.location = profile.location;
      }

      this.lastLoginDate = localStorage.getItem('lastLoginDate');
    }
  }

  private saveProfile(): void {
    if (isPlatformBrowser(this.platformId)) {
      const profile = {
        name: this.adminName,
        phone: this.adminPhone,
        imageUrl: this.profileImageUrl,
        companyName: this.companyName,
        location: this.location
      };
      localStorage.setItem('adminProfile', JSON.stringify(profile));

      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        currentUser.fullName = this.adminName;
        currentUser.companyName = this.companyName;
        currentUser.location = this.location;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
    }
  }

  public navigateTo(event: Event, path: string): void {
    event.preventDefault();
    this.router.navigate([path]);
  }

  // --- Profile Editing Methods ---
  public toggleEditProfile(): void {
    if (this.isEditingProfile) {
      this.saveProfile();
    }
    this.isEditingProfile = !this.isEditingProfile;
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileImageUrl = e.target?.result as string;
        // Save immediately after image selection
        this.saveProfile();
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  // --- Weekly Report Methods ---
  private calculateCurrentWeek(): void {
    const now = new Date();
    // Get ISO week number
    const tempDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - (tempDate.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    this.weekNumber = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    // Calculate Monday of the current week
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const formatDate = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;
    this.weekDateRange = `${formatDate(monday)} - ${formatDate(sunday)}, ${sunday.getFullYear()}`;
  }

  public navigateToGenerateReport(): void {
    // Placeholder for future navigation
    console.log('Navegar a generar reporte semanal');
  }

  public navigateToManageReports(): void {
    // Placeholder for future navigation
    console.log('Navegar a administrar reportes');
  }

  // --- Success Modal Methods ---
  public showSuccessModal(): void {
    this.isSuccessModalVisible = true;
  }

  public hideSuccessModal(): void {
    this.isSuccessModalVisible = false;
  }

  public requestLogout(): void {
    this.isLogoutConfirmationVisible = true;
  }

  public cancelLogout(): void {
    this.isLogoutConfirmationVisible = false;
  }

  public logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

