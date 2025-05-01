// src/app/core/services/user-auth.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { map, tap, delayWhen } from 'rxjs/operators';

// Interface simple pour l'info utilisateur stockée/émise
export interface UserInfo {
  email: string;
  // On pourrait ajouter id, name, etc. plus tard
}

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {
  // Clés localStorage spécifiques à l'utilisateur
  private readonly USER_TOKEN_KEY = 'app_user_token';
  private readonly USER_INFO_KEY = 'app_user_info';
  // Clé (simpliste) pour simuler les emails enregistrés
  private readonly REGISTERED_EMAILS_KEY = 'app_registered_emails';

  // Sujet pour l'utilisateur actuellement connecté
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(this.loadInitialUser());
  /** Observable émettant l'utilisateur connecté (UserInfo) ou null. */
  public currentUser$: Observable<UserInfo | null> = this.currentUserSubject.asObservable();

  private router = inject(Router);

  constructor() {
    const initialUser = this.currentUserSubject.getValue();
    console.log('[UserAuthService] Initialisé. Utilisateur initial:', initialUser);
  }

  /** Charge l'utilisateur depuis localStorage au démarrage */
  private loadInitialUser(): UserInfo | null {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(this.USER_TOKEN_KEY);
      const userInfoJson = localStorage.getItem(this.USER_INFO_KEY);
      // On considère l'utilisateur connecté seulement si le token ET les infos sont présents
      if (token && userInfoJson) {
        try {
          const userInfo: UserInfo = JSON.parse(userInfoJson);
          // Validation très basique
          if (userInfo && typeof userInfo.email === 'string') {
            return userInfo;
          }
        } catch (e) {
          console.error('[UserAuthService] Erreur parsing user info depuis localStorage', e);
          this.clearUserData(); // Nettoyer si invalide
          return null;
        }
      }
    }
    return null;
  }

  /** Simule l'enregistrement d'un utilisateur */
  register(credentials: { email: string, password?: string }): Observable<boolean> {
    console.log('[UserAuthService] Tentative d\'enregistrement pour:', credentials.email);
    const email = credentials.email.toLowerCase().trim();
    // Ignorer le mot de passe pour la simulation simple

    // Simuler délai réseau
    return of(null).pipe(
      delayWhen(() => timer(300)),
      map(() => {
        if (typeof localStorage === 'undefined') return false; // Pas de localStorage

        const registeredEmails = this.getRegisteredEmails();

        if (registeredEmails.includes(email)) {
          console.warn(`[UserAuthService] Échec enregistrement : Email "${email}" déjà utilisé.`);
          return false; // Email déjà pris
        } else {
          // "Enregistrer" l'email
          registeredEmails.push(email);
          localStorage.setItem(this.REGISTERED_EMAILS_KEY, JSON.stringify(registeredEmails));
          console.log(`[UserAuthService] Enregistrement réussi (simulé) pour : ${email}`);
          return true; // Succès
        }
      })
    );
  }

  /** Simule la connexion d'un utilisateur */
  login(credentials: { email: string, password?: string }): Observable<boolean> {
    console.log('[UserAuthService] Tentative de connexion pour:', credentials.email);
    const email = credentials.email.toLowerCase().trim();
    // Ignorer le mot de passe pour la simulation simple

     // Simuler délai réseau
     return of(null).pipe(
      delayWhen(() => timer(500)),
      map(() => {
          if (typeof localStorage === 'undefined') return false;

          const registeredEmails = this.getRegisteredEmails();

          // Simulation simple : vérifier seulement si l'email est "enregistré"
          if (registeredEmails.includes(email)) {
              console.log(`[UserAuthService] Connexion réussie (simulée) pour : ${email}`);
              const fakeToken = `fake-user-token-${email}-${Date.now()}`;
              const userInfo: UserInfo = { email: email };
              this.storeUserData(fakeToken, userInfo); // Stocker token/info et mettre à jour le sujet
              return true;
          } else {
              console.warn(`[UserAuthService] Échec connexion : Email "${email}" non trouvé.`);
              this.clearUserData(); // S'assurer qu'on est déconnecté
              return false;
          }
      })
    );
  }

  /** Déconnecte l'utilisateur */
  logout(): void {
    console.log('[UserAuthService] Déconnexion utilisateur...');
    this.clearUserData(); // Supprime token/info et met à jour le sujet
    // Redirection optionnelle (peut être gérée par le composant appelant)
    // this.router.navigate(['/']);
  }

  /** Récupère l'utilisateur actuellement connecté (valeur synchrone) */
  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.getValue();
  }

  // --- Helpers pour localStorage ---

  private storeUserData(token: string, userInfo: UserInfo): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.USER_TOKEN_KEY, token);
      localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfo));
      console.log('[UserAuthService] Données utilisateur stockées dans localStorage.');
    }
    this.currentUserSubject.next(userInfo); // Émettre le nouvel utilisateur connecté
  }

  private clearUserData(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.USER_TOKEN_KEY);
      localStorage.removeItem(this.USER_INFO_KEY);
      console.log('[UserAuthService] Données utilisateur supprimées de localStorage.');
    }
    if (this.currentUserSubject.getValue() !== null) {
      this.currentUserSubject.next(null); // Émettre null si l'utilisateur était connecté
    }
  }

  private getRegisteredEmails(): string[] {
    if (typeof localStorage === 'undefined') return [];
    const storedEmails = localStorage.getItem(this.REGISTERED_EMAILS_KEY);
    if (storedEmails) {
      try {
        const emails = JSON.parse(storedEmails);
        return Array.isArray(emails) ? emails : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}