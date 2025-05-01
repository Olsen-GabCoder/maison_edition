// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service'; // Ajuste le chemin si nécessaire

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  const authService = inject(AuthService);
  const authToken = authService.getToken(); // Utilise la méthode du service pour récupérer le token

  // Cloner la requête pour ajouter le header Authorization
  // Seulement si un token existe ET si la requête ne va pas vers une URL d'authentification (optionnel)
  // Exemple: ne pas envoyer le token à '/api/auth/login' ou '/api/auth/register'
  const isAuthUrl = req.url.includes('/api/auth/'); // Adapte selon tes URL d'API

  if (authToken && !isAuthUrl) {
    // console.log('[AuthInterceptor] Ajout du token Bearer aux headers.'); // Log verbeux si besoin
    const authReq = req.clone({
      setHeaders: {
        // Le standard est 'Bearer token_string'
        Authorization: `Bearer ${authToken}`
      }
    });
    // Passer la requête clonée avec le header au prochain handler
    return next(authReq);
  } else {
    // Si pas de token ou si c'est une URL d'authentification, passer la requête originale
    return next(req);
  }
};