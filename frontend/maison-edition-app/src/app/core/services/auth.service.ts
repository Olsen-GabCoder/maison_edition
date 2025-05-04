// src/app/core/services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // Gardé pour une future intégration API
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { catchError, map, tap, delayWhen } from 'rxjs/operators';
import { UserProfile } from '../../models/user.model'; // Assurez-vous que ce chemin est correct

// --- Fonction de Décodage JWT (Simple) ---
// NOTE: Dans une application réelle avec un backend, le décodage peut ne pas être nécessaire
//       côté client, ou utiliser une bibliothèque dédiée comme jwt-decode si besoin.
function simpleJwtDecode<T>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Correction potentielle pour gérer les caractères spéciaux après atob
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erreur décodage JWT simple:', error);
    return null;
  }
}
// --- Fin Décodage JWT ---

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient); // Injecté mais non utilisé dans la simulation

  // Clés pour le stockage local (simulation)
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REGISTERED_EMAILS_KEY = 'app_registered_emails';

  // État interne de l'utilisateur et exposition via Observable/Signal
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(
    this.loadInitialUser()
  );
  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn = signal<boolean>(this.hasValidToken());

  // Identifiants pour l'utilisateur admin (simulation)
  private adminCredentials = { email: 'admin@example.com', password: 'password123' };

  constructor() {
    console.log(
      '[AuthService] Initialisé. Statut connexion initial (signal):',
      this.isLoggedIn()
    );
    // Optionnel: loguer la valeur initiale du sujet
    // console.log('[AuthService] Utilisateur initial (subject):', this.currentUserSubject.getValue());
  }

  // --- Méthodes de gestion Token/User (Simulation) ---

  /** Charge l'utilisateur initial depuis le token stocké (si valide et non expiré) */
  private loadInitialUser(): UserProfile | null {
    const token = this.getToken();
    if (token && typeof localStorage !== 'undefined') { // Vérifier localStorage ici aussi
      const decoded = this.decodeToken(token);
      if (decoded && !this.isTokenExpired(decoded.exp)) {
        console.log('[AuthService] Utilisateur initial chargé depuis token valide:', decoded);
        return decoded;
      } else {
        console.warn(
          '[AuthService] Token initial trouvé mais invalide ou expiré. Nettoyage.'
        );
        this.clearTokenInternal(); // Nettoie localStorage et met à jour les sujets/signaux
        return null;
      }
    }
    // console.log('[AuthService] Aucun token initial trouvé ou localStorage indisponible.');
    return null;
  }

  /** Récupère le token depuis localStorage */
  getToken(): string | null {
    // Vérifier la disponibilité de localStorage à chaque appel
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /** Vérifie si un token valide (décodedable et non expiré) existe */
  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const decoded = this.decodeToken(token);
    // Vérifie si décodé ET non expiré
    return !!decoded && !this.isTokenExpired(decoded.exp);
  }

  /** Vérifie si le timestamp d'expiration est passé */
  private isTokenExpired(expiration?: number): boolean {
    // Si pas de champ 'exp', on considère le token comme non-expirable (pour la simulation)
    if (expiration === undefined || expiration === null) return false;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return expiration < nowInSeconds;
  }

  /** Tente de décoder le token JWT */
  private decodeToken(token: string): UserProfile | null {
    return simpleJwtDecode<UserProfile>(token);
  }

  /** Stocke le token, décode l'utilisateur, et met à jour l'état interne */
  private storeTokenAndUser(token: string): void {
    const decoded = this.decodeToken(token);
    if (decoded) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.TOKEN_KEY, token);
      } else {
        console.warn("[AuthService] localStorage non disponible pour stocker le token.");
      }
      this.currentUserSubject.next(decoded); // Met à jour l'observable
      this.isLoggedIn.set(true); // Met à jour le signal
      console.log('[AuthService] Token stocké, utilisateur mis à jour:', decoded);
    } else {
      console.error(
        '[AuthService] Impossible de décoder le token reçu lors du stockage.'
      );
      this.clearTokenInternal(); // Nettoyer en cas de token invalide
    }
  }

  /** Supprime le token de localStorage et réinitialise l'état interne */
  private clearTokenInternal(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
       console.log('[AuthService] Token supprimé de localStorage.');
    }
    // S'assurer de mettre à jour l'état même si localStorage n'était pas dispo
    if (this.currentUserSubject.getValue() !== null) {
        this.currentUserSubject.next(null);
    }
    if (this.isLoggedIn()) {
        this.isLoggedIn.set(false);
    }
  }

  /** Retourne la valeur actuelle de l'utilisateur connecté (synchrone) */
  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.getValue();
  }

  /** Retourne le rôle de l'utilisateur actuel ou null */
  getCurrentUserRole(): string | null {
    return this.getCurrentUser()?.role ?? null;
  }

  // === Méthode REGISTER (Simulation) ===
  /**
   * Simule l'enregistrement d'un nouvel utilisateur en vérifiant si l'email
   * existe déjà dans une liste stockée localement.
   */
  register(credentials: { email: string; password?: string }): Observable<void> {
    console.log('[AuthService] Appel register (simulation) pour:', credentials.email);
    const email = credentials.email.toLowerCase().trim();

    // Simule un délai réseau
    return of(null).pipe(
      delayWhen(() => timer(300)), // Délai de 300ms
      map(() => {
        if (typeof localStorage === 'undefined') {
          throw new Error('Stockage local non disponible.');
        }
        const registeredEmails = this.getRegisteredEmails();
        if (registeredEmails.includes(email)) {
          // Simule une erreur si l'email est déjà pris
          throw new Error(`L'adresse email "${email}" est déjà utilisée.`);
        } else {
          // Ajoute l'email à la liste et sauvegarde
          registeredEmails.push(email);
          localStorage.setItem(
            this.REGISTERED_EMAILS_KEY,
            JSON.stringify(registeredEmails)
          );
          console.log(
            `[AuthService] Enregistrement réussi (simulé) pour : ${email}`
          );
          return; // Indique le succès (void)
        }
      }),
      catchError((error) => {
        // Relance l'erreur pour que le composant puisse la gérer
        console.error(
          "[AuthService] Erreur lors de l'enregistrement (simulation):",
          error.message || error
        );
        return throwError(() => error);
      })
    );
  }

  /** Méthode privée pour récupérer la liste des emails enregistrés (simulation) */
  private getRegisteredEmails(): string[] {
    if (typeof localStorage === 'undefined') return [];
    const storedEmails = localStorage.getItem(this.REGISTERED_EMAILS_KEY);
    if (storedEmails) {
      try {
        const emails = JSON.parse(storedEmails);
        // Vérifie si c'est bien un tableau
        return Array.isArray(emails) ? emails : [];
      } catch (e) {
        console.error('Erreur lecture emails enregistrés:', e);
        return []; // Retourne vide en cas d'erreur de parsing
      }
    }
    return []; // Retourne vide si la clé n'existe pas
  }

  // === Méthode LOGIN (Simulation) ===
  /**
   * Simule la connexion en vérifiant les identifiants contre l'admin prédéfini
   * ou la liste des emails enregistrés. Génère un faux token si succès.
   */
  login(credentials: { email: string; password: string }): Observable<UserProfile> {
    console.log(`[AuthService] Appel login (simulation) pour: ${credentials.email}`);
    // Simule un délai réseau
    return of(credentials).pipe(
      delayWhen(() => timer(500)), // Délai de 500ms
      map((creds) => {
        let fakeTokenPayload: UserProfile | null = null;
        const emailLower = creds.email.toLowerCase();

        // Cas 1: Identifiants Admin
        if (emailLower === this.adminCredentials.email && creds.password === this.adminCredentials.password) {
          console.log('[AuthService] Identifiants Admin reconnus.');
          fakeTokenPayload = {
            id: 'admin001', // ID fixe pour l'admin
            email: emailLower,
            role: 'admin',
            firstName: 'Admin', // Prénom/Nom par défaut pour l'admin
            lastName: 'User',
            exp: Math.floor(Date.now() / 1000) + 3600, // Expire dans 1 heure
          };
        }
        // Cas 2: Email utilisateur "enregistré" (mot de passe ignoré dans simulation simple)
        else if (this.getRegisteredEmails().includes(emailLower)) {
            console.log('[AuthService] Email utilisateur enregistré reconnu.');
          // Pour un utilisateur normal, on ne met pas de nom/prénom par défaut
          fakeTokenPayload = {
            id: `user_${emailLower}`, // ID basé sur l'email
            email: emailLower,
            role: 'user',
            // firstName: '', // Laisser vide ou undefined
            // lastName: '',
            exp: Math.floor(Date.now() / 1000) + 3600, // Expire dans 1 heure
          };
        }

        // Si un payload a été créé (connexion réussie)
        if (fakeTokenPayload) {
          // Générer un faux token (non sécurisé, juste pour la structure)
          const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
          const payload = btoa(JSON.stringify(fakeTokenPayload));
          const signature = btoa('fakeSignature'); // Signature factice
          const fakeToken = `${header}.${payload}.${signature}`;

          // Stocker le token et mettre à jour l'état
          this.storeTokenAndUser(fakeToken);

          // Retourner le profil utilisateur actuel (non-null garanti après storeTokenAndUser)
          return this.getCurrentUser()!;
        } else {
          // Si aucun payload n'a été créé, lancer une erreur
           console.warn('[AuthService] Identifiants simulés invalides.');
          throw new Error('Identifiants simulés invalides');
        }
      }),
      catchError((error) => {
        // Gérer l'erreur (ex: identifiants invalides) et la relancer
        console.error('[AuthService] Erreur simulation login:', error.message);
        // Retourner une erreur plus conviviale pour le composant
        return throwError(
          () =>
            new Error(
              'Échec de la connexion (simulation). Vérifiez vos identifiants.'
            )
        );
      })
    );
  }

  // === Méthode LOGOUT ===
  /** Déconnecte l'utilisateur en supprimant le token et en réinitialisant l'état. */
  logout(): void {
    console.log('[AuthService] Déconnexion...');
    this.clearTokenInternal(); // Nettoie token et état interne
    this.router.navigate(['/login']); // Redirige systématiquement vers la page de connexion
  }

  // === Méthode pour le guard (synchrone) ===
  /**
   * Méthode synchrone utilisée par le guard pour vérifier rapidement si
   * l'utilisateur peut activer une route (basé sur la présence d'un token valide).
   */
  canActivateGuard(): boolean {
    // Note: Cette méthode est synchrone et ne garantit pas que le token
    // n'expire pas *juste après* la vérification. Pour une sécurité accrue,
    // un resolver ou une vérification asynchrone pourrait être envisagée.
    return this.hasValidToken();
  }

  // === Méthode pour mettre à jour le profil utilisateur (Simulation) ===
  /**
   * Simule la mise à jour du prénom et/ou nom de l'utilisateur.
   * Met à jour le faux token JWT dans localStorage et l'état interne.
   * @param updatedData Un objet contenant `firstName` et/ou `lastName`.
   * @returns Un Observable émettant le `UserProfile` mis à jour.
   */
  updateUserProfile(updatedData: Partial<Pick<UserProfile, 'firstName' | 'lastName'>>): Observable<UserProfile> {
    console.log('[AuthService] Appel updateUserProfile (simulation) avec:', updatedData);

    if (typeof localStorage === 'undefined') {
      console.error("[AuthService] localStorage non disponible pour updateUserProfile.");
      return throwError(() => new Error('Stockage local non disponible.'));
    }

    // Simuler un délai réseau
    return timer(500).pipe(
      // Utiliser map pour transformer la valeur émise par timer
      map(() => {
        const currentToken = this.getToken();
        const currentUser = this.getCurrentUser(); // Récupère la dernière valeur connue

        if (!currentToken || !currentUser) {
          console.error(
            '[AuthService] Impossible de mettre à jour : utilisateur non connecté ou token introuvable.'
          );
          throw new Error('Utilisateur non connecté.');
        }

        // 1. Fusionner les données actuelles avec les nouvelles données
        //    en s'assurant de garder les champs existants non modifiés.
        const newProfileData: UserProfile = {
          ...currentUser, // Copie toutes les propriétés existantes (id, email, role, exp...)
          // Met à jour seulement firstName/lastName s'ils sont fournis, sinon garde les anciennes valeurs
          firstName: updatedData.firstName !== undefined ? updatedData.firstName : currentUser.firstName,
          lastName: updatedData.lastName !== undefined ? updatedData.lastName : currentUser.lastName,
        };
        // Assurer que les champs optionnels non mis à jour restent optionnels (ou définis si existants)
        if (newProfileData.firstName === undefined) delete newProfileData.firstName;
        if (newProfileData.lastName === undefined) delete newProfileData.lastName;


        // 2. Re-créer un faux token JWT avec les données mises à jour
        //    (Important: garder l'expiration 'exp' d'origine ou la recalculer si besoin)
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify(newProfileData)); // Utilise le profil complet mis à jour
        const signature = btoa('fakeSignatureUpdated'); // Nouvelle signature factice
        const newToken = `${header}.${payload}.${signature}`;

        // 3. Stocker le nouveau token et mettre à jour le BehaviorSubject/Signal
        this.storeTokenAndUser(newToken);

        console.log(
          '[AuthService] Profil mis à jour et nouveau token stocké (simulation):',
          newProfileData
        );

        // 4. Retourner le profil mis à jour
        return newProfileData;
      }),
      catchError((error) => {
        console.error(
          '[AuthService] Erreur lors de la mise à jour du profil (simulation):',
          error.message || error
        );
        // Relancer une erreur pour le composant
        return throwError(() => new Error('Échec de la mise à jour du profil.'));
      })
    );
  }
}