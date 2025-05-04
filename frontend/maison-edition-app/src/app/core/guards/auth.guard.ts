// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[] | undefined;
  const forbiddenRoles = route.data['forbiddenRoles'] as string[] | undefined;

  const isLoggedIn = authService.hasValidToken();

  if (!isLoggedIn) {
    console.log(`[AuthGuard] Non connecté - Redirection vers /login`);
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const userRole = authService.getCurrentUserRole();
  console.log(`[AuthGuard] Connecté en tant que : ${userRole}`);

  // Vérifie si le rôle est INTERDIT
  if (
    forbiddenRoles &&
    forbiddenRoles.length > 0 &&
    userRole &&
    forbiddenRoles.includes(userRole)
  ) {
    const redirectUrl = userRole === 'admin' ? '/admin' : '/unauthorized';
    console.warn(
      `[AuthGuard] Rôle interdit ('${userRole}') pour ${state.url} - Redirection vers ${redirectUrl}`
    );
    return router.createUrlTree([redirectUrl]);
  }

  // Vérifie si des rôles sont requis
  if (
    requiredRoles &&
    requiredRoles.length > 0 &&
    (!userRole || !requiredRoles.includes(userRole))
  ) {
    console.warn(
      `[AuthGuard] Accès refusé - Le rôle '${userRole}' n'est pas autorisé pour cette route`
    );
    return router.createUrlTree(['/unauthorized']);
  }

  return true;
};
