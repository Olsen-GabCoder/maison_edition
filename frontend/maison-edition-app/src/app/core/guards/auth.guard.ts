// src/app/core/guards/auth.guard.ts - VERSION MISE À JOUR POUR JWT + RÔLES
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
// Importer le NOUVEAU AuthService (le chemin devrait être correct)
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // Injecte le service mis à jour
  const router = inject(Router);

  // === Étape 1: Récupérer les rôles requis depuis la route ===
  // On lit la propriété 'roles' dans les 'data' de la route
  // Exemple de définition dans app.routes.ts: { path: 'admin', ..., data: { roles: ['admin'] } }
  const requiredRoles = route.data['roles'] as Array<string> | undefined;

  // === Étape 2: Vérifier si l'utilisateur est connecté (token valide) ===
  // Utiliser une méthode synchrone du service qui vérifie le token
  const isLoggedIn = authService.hasValidToken(); // <<<=== APPEL MÉTHODE MISE À JOUR (suppose qu'elle existe)
  // Ou si AuthService expose un signal : const isLoggedIn = authService.isLoggedIn();

  // === Étape 3: Si non connecté, rediriger vers la page de login unique ===
  if (!isLoggedIn) {
    console.log(`[AuthGuard] Accès refusé pour ${state.url} (non connecté ou token invalide). Redirection vers /login.`);
    // Garder l'URL de retour pour rediriger l'utilisateur après connexion
    const returnUrl = state.url;
    const loginUrlTree: UrlTree = router.createUrlTree(['/login'], { // <<<=== REDIRIGE VERS /login (page unique)
       queryParams: { returnUrl: returnUrl }
    });
    return loginUrlTree;
  }

  // === Étape 4: Si connecté, vérifier les rôles (si la route en spécifie) ===
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = authService.getCurrentUserRole(); // Récupère le rôle depuis le token décodé
    console.log(`[AuthGuard] Vérification rôle pour ${state.url}. Requis: ${requiredRoles.join('/')}. Utilisateur: ${userRole}`);

    // Vérifier si l'utilisateur a un rôle ET si ce rôle est inclus dans les rôles requis
    if (!userRole || !requiredRoles.includes(userRole)) {
      console.warn(`[AuthGuard] Accès refusé pour ${state.url} - Rôle insuffisant. Redirection vers /unauthorized.`);
      // Rediriger vers une page "Accès non autorisé"
      const unauthorizedUrlTree: UrlTree = router.createUrlTree(['/unauthorized']); // Assure-toi que cette route existe
      return unauthorizedUrlTree;
    } else {
      // L'utilisateur est connecté ET a le rôle requis
      console.log(`[AuthGuard] Accès autorisé pour ${state.url} (Rôle correspondant).`);
      return true;
    }
  }

  // === Étape 5: Si connecté et aucun rôle spécifique n'est requis par la route ===
  console.log(`[AuthGuard] Accès autorisé pour ${state.url} (Connecté, pas de rôle spécifique requis).`);
  return true;
};

// Note: Assure-toi que AuthService expose bien une méthode synchrone comme hasValidToken()
// ou un signal isLoggedIn() pour cette vérification directe. Sinon, il faudrait que le guard
// retourne un Observable<boolean | UrlTree> et utilise currentUser$.pipe(map(...))
// mais l'approche synchrone est souvent plus simple si possible.