// src/app/app.config.ts
import { ApplicationConfig, LOCALE_ID } from '@angular/core'; // <<<=== LOCALE_ID ajouté
import { provideRouter, withDebugTracing } from '@angular/router'; // withDebugTracing est optionnel mais utile
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// --- Imports pour la localisation ---
import { registerLocaleData } from '@angular/common'; // <<<=== Importé
import localeFr from '@angular/common/locales/fr'; // <<<=== Importé

import { routes } from './app.routes';

// Import potentiel pour le rendu côté serveur (si activé)
// import { provideClientHydration } from '@angular/platform-browser';

// === Enregistrer la locale AVANT la configuration ===
registerLocaleData(localeFr, 'fr'); // <<<=== Ligne ajoutée

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes /* , withDebugTracing() */), // Décommentez withDebugTracing() si besoin
    provideHttpClient(), // Gardé si nécessaire
    provideAnimations(),

    // === Fournir la locale par défaut ===
    { provide: LOCALE_ID, useValue: 'fr' }, // <<<=== Provider ajouté

    // Potentiellement d'autres providers
    // provideClientHydration()
  ]
};