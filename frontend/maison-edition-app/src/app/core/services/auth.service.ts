// src/app/core/services/auth.service.ts - VERSION FINALE AVEC REGISTER
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs'; // timer ajouté pour délai éventuel
import { catchError, map, tap, delayWhen } from 'rxjs/operators'; // delayWhen ajouté
import { UserProfile } from '../../models/user.model'; // Adapter le chemin si besoin

// --- Fonction de Décodage JWT ---
// (Garder simpleJwtDecode ou remplacer par jwt-decode si installé)
function simpleJwtDecode<T>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1]; if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) { console.error("Erreur décodage JWT:", error); return null; }
}
// --- Fin Décodage JWT ---

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);

  private readonly TOKEN_KEY = 'auth_token';
  // --- AJOUT Clé pour emails enregistrés (simulation) ---
  private readonly REGISTERED_EMAILS_KEY = 'app_registered_emails';

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.loadInitialUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn = signal<boolean>(this.hasValidToken());

  // Identifiants Admin pour simulation login
  private adminCredentials = { email: 'admin@example.com', password: 'password123' };

  constructor() {
    console.log('[AuthService] Initialisé. Statut connexion initial:', this.isLoggedIn());
  }

  // --- Méthodes de gestion Token/User ---
  private loadInitialUser(): UserProfile | null { /* ... (code inchangé) ... */
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      if (decoded && !this.isTokenExpired(decoded.exp)) {
         console.log('[AuthService] Utilisateur initial chargé depuis token:', decoded);
         return decoded;
      } else {
        console.warn('[AuthService] Token initial trouvé mais invalide ou expiré. Nettoyage.');
        this.clearTokenInternal();
        return null;
      }
    }
    return null;
  }
  getToken(): string | null { /* ... (code inchangé) ... */
    return typeof localStorage !== 'undefined' ? localStorage.getItem(this.TOKEN_KEY) : null;
  }
   hasValidToken(): boolean { /* ... (code inchangé) ... */
    const token = this.getToken();
    if (!token) return false;
    const decoded = this.decodeToken(token);
    return !!decoded && !this.isTokenExpired(decoded.exp);
   }
  private isTokenExpired(expiration?: number): boolean { /* ... (code inchangé) ... */
    if (expiration === undefined) return false;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const isExpired = expiration < nowInSeconds;
    // if (isExpired) { console.warn(`[AuthService] Token expiré`); } // Log optionnel
    return isExpired;
   }
  private decodeToken(token: string): UserProfile | null { /* ... (code inchangé) ... */
     return simpleJwtDecode<UserProfile>(token);
   }
  private storeTokenAndUser(token: string): void { /* ... (code inchangé) ... */
    const decoded = this.decodeToken(token);
    if (decoded) {
      if(typeof localStorage !== 'undefined') { localStorage.setItem(this.TOKEN_KEY, token); }
      this.currentUserSubject.next(decoded);
      this.isLoggedIn.set(true);
      console.log('[AuthService] Token stocké, utilisateur mis à jour:', decoded);
    } else {
       console.error("[AuthService] Impossible de décoder le token reçu.");
       this.clearTokenInternal();
    }
   }
  private clearTokenInternal(): void { /* ... (code inchangé) ... */
    if(typeof localStorage !== 'undefined') { localStorage.removeItem(this.TOKEN_KEY); }
    this.currentUserSubject.next(null);
    this.isLoggedIn.set(false);
   }
  getCurrentUser(): UserProfile | null { /* ... (code inchangé) ... */
    if (!this.hasValidToken()) { this.clearTokenInternal(); return null; }
    return this.currentUserSubject.getValue();
   }
  getCurrentUserRole(): string | null { /* ... (code inchangé) ... */
    return this.getCurrentUser()?.role ?? null;
   }

  // === AJOUT MÉTHODE REGISTER ===
  /**
   * Simule l'enregistrement d'un NOUVEL utilisateur (client uniquement).
   * Ne connecte PAS l'utilisateur après inscription.
   * Retourne un Observable<void> qui complète sur succès ou émet une erreur.
   */
  register(credentials: { email: string, password?: string }): Observable<void> { // <<<=== Retourne Observable<void>
    console.log('[AuthService] Appel register pour:', credentials.email);
    const email = credentials.email.toLowerCase().trim();
    // Mot de passe ignoré dans cette simulation

    // Simuler délai réseau
    return of(null).pipe(
      delayWhen(() => timer(300)), // Simule attente
      map(() => {
        if (typeof localStorage === 'undefined') {
            console.error("[AuthService] localStorage non disponible pour register.");
            throw new Error("Stockage local non disponible.");
        }

        const registeredEmails = this.getRegisteredEmails(); // Utilise la méthode helper

        if (registeredEmails.includes(email)) {
          console.warn(`[AuthService] Échec enregistrement : Email "${email}" déjà utilisé.`);
          // Lever une erreur spécifique
          throw new Error(`L'adresse email "${email}" est déjà utilisée.`);
        } else {
          // "Enregistrer" l'email
          registeredEmails.push(email);
          localStorage.setItem(this.REGISTERED_EMAILS_KEY, JSON.stringify(registeredEmails));
          console.log(`[AuthService] Enregistrement réussi (simulé) pour : ${email}`);
          // Pas besoin de retourner true, l'absence d'erreur suffit
          return; // Complète simplement
        }
      }),
      catchError(error => {
          // Renvoyer l'erreur au composant
          console.error('[AuthService] Erreur lors de l\'enregistrement:', error.message || error);
          return throwError(() => error); // Propager l'erreur originale ou une nouvelle
      })
    );
  }
  // === FIN AJOUT MÉTHODE REGISTER ===

  // === AJOUT MÉTHODE HELPER POUR REGISTER ===
  /** Récupère la liste (simulée) des emails enregistrés depuis localStorage */
  private getRegisteredEmails(): string[] {
    if (typeof localStorage === 'undefined') {
      console.warn("[AuthService] localStorage non disponible pour getRegisteredEmails.");
      return [];
    }
    const storedEmails = localStorage.getItem(this.REGISTERED_EMAILS_KEY);
    if (storedEmails) {
      try {
        const emails = JSON.parse(storedEmails);
        return Array.isArray(emails) ? emails : [];
      } catch (e) {
        console.error("Erreur lecture emails enregistrés:", e);
        // En cas d'erreur de parsing, on pourrait vouloir nettoyer la clé invalide
        // localStorage.removeItem(this.REGISTERED_EMAILS_KEY);
        return [];
      }
    }
    return []; // Retourner un tableau vide si la clé n'existe pas
  }
  // === FIN AJOUT HELPER ===

  /** Effectue la connexion (simulée ou réelle) */
  login(credentials: { email: string, password: string }): Observable<UserProfile> { /* ... (code inchangé de l'étape précédente) ... */
    console.log(`[AuthService] Appel login pour: ${credentials.email}`);
    // --- Simulation ---
    console.warn("[AuthService] Utilisation de la simulation de login !");
    return of(credentials).pipe(
        tap(() => console.log("[AuthService] Simulation: Vérification...")),
        // delayWhen(() => timer(500)), // Simuler délai
        map(creds => {
            let fakeTokenPayload: UserProfile | null = null;
            const emailLower = creds.email.toLowerCase(); // Comparer en minuscule

            if (emailLower === this.adminCredentials.email && creds.password === this.adminCredentials.password) {
                console.log("[AuthService] Simulation: ADMIN reconnu.");
                fakeTokenPayload = { id: 'admin001', email: emailLower, role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 };
            } else if (this.getRegisteredEmails().includes(emailLower)) { // Vérifier si l'email user est enregistré
                 // Simuler succès si email enregistré (ignorer mdp pour l'instant)
                 console.log("[AuthService] Simulation: USER reconnu (email enregistré).");
                 fakeTokenPayload = { id: `user_${emailLower}`, email: emailLower, role: 'user', exp: Math.floor(Date.now() / 1000) + 3600 };
            }

            if (fakeTokenPayload) {
                const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
                const payload = btoa(JSON.stringify(fakeTokenPayload));
                const signature = 'fakeSignature';
                const fakeToken = `${header}.${payload}.${signature}`;
                this.storeTokenAndUser(fakeToken);
                return this.getCurrentUser()!;
            } else {
                console.log("[AuthService] Simulation: Identifiants non reconnus.");
                this.clearTokenInternal();
                throw new Error('Identifiants simulés invalides');
            }
        }),
        catchError(error => {
             console.error('[AuthService] Erreur simulation login:', error.message);
            return throwError(() => new Error('Échec de la connexion (simulation). Vérifiez vos identifiants.'));
        })
    );
   }

  /** Effectue la déconnexion */
  logout(): void { /* ... (code inchangé) ... */
    console.log('[AuthService] Déconnexion...');
    this.clearTokenInternal();
    this.router.navigate(['/login']);
  }

  /** Méthode pour le guard (synchrone) */
  canActivateGuard(): boolean { /* ... (code inchangé) ... */
      const can = this.hasValidToken();
      // console.log(`[AuthService] canActivateGuard appelé. Résultat: ${can}`); // Log optionnel
      return can;
  }
}