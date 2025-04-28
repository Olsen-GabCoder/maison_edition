// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withDebugTracing } from '@angular/router'; // withDebugTracing est optionnel mais utile

// === Vérifier cet import et le nom 'routes' ===
import { routes } from './app.routes';

// Import potentiel pour le rendu côté serveur (si activé)
// import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    // === Vérifier que 'routes' ici correspond à l'import ===
    provideRouter(routes /* , withDebugTracing() */), // Décommentez withDebugTracing() si besoin de logs détaillés

    // Potentiellement d'autres providers
    // provideClientHydration()
  ]
};