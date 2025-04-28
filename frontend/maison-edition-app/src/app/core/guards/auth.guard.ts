import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log(`[AuthGuard] Vérification de l'accès pour: ${state.url}`);

  if (authService.isAuthenticated()) {
    console.log('[AuthGuard] Accès autorisé (utilisateur authentifié).');
    return true;
  } else {
    console.log('[AuthGuard] Accès refusé (utilisateur non authentifié). Redirection vers /admin/login.');
    const loginUrlTree: UrlTree = router.createUrlTree(['/admin/login']);
    return loginUrlTree;
  }
};
