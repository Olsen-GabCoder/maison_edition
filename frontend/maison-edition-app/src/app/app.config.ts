// src/app/app.config.ts - AVEC INTERCEPTEUR
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter, withDebugTracing } from '@angular/router';
// --- MODIFICATION Import HttpClient ---
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // <<< withInterceptors ajouté
import { provideAnimations } from '@angular/platform-browser/animations';

import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { routes } from './app.routes';
// --- AJOUT Import Interceptor ---
import { authInterceptor } from './core/interceptors/auth.interceptor'; // <<<=== IMPORTER L'INTERCEPTEUR (adapter chemin si besoin)

// Import potentiel pour le rendu côté serveur (si activé)
// import { provideClientHydration } from '@angular/platform-browser';

registerLocaleData(localeFr, 'fr');

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes /* , withDebugTracing() */),

    // --- MODIFICATION provideHttpClient ---
    // Utiliser withInterceptors pour enregistrer notre intercepteur
    provideHttpClient(withInterceptors([authInterceptor])), // <<<=== MODIFIÉ/AJOUTÉ

    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'fr' },

    // Potentiellement d'autres providers
    // provideClientHydration()
  ]
};