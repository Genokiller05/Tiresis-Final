import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformServer } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Bypass auth check on server to prevent incorrect redirects during SSR/Refresh
  if (isPlatformServer(platformId)) {
    return true;
  }

  if (authService.hasToken()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
