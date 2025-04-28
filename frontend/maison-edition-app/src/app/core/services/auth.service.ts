import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root' // Service disponible globalement (singleton)
})
export class AuthService {
  private readonly AUTH_STATUS_KEY = 'app_auth_status';

  private loggedIn = new BehaviorSubject<boolean>(this.checkInitialAuthStatus());
  public isLoggedIn$: Observable<boolean> = this.loggedIn.asObservable();

  private adminCredentials = { email: 'admin@example.com', password: 'password123' };

  constructor(private router: Router) { }

  private checkInitialAuthStatus(): boolean {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.AUTH_STATUS_KEY) === 'true';
    }
    return false;
  }

  login(credentials: { email: string, password: string }): Observable<boolean> {
    const isValid = credentials.email === this.adminCredentials.email &&
                    credentials.password === this.adminCredentials.password;

    if (isValid) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.AUTH_STATUS_KEY, 'true');
      }
      this.loggedIn.next(true);
      console.log('AuthService: Connexion réussie');
      return of(true);
    } else {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.AUTH_STATUS_KEY);
      }
      this.loggedIn.next(false);
      console.log('AuthService: Échec de la connexion');
      return of(false);
    }
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.AUTH_STATUS_KEY);
    }
    this.loggedIn.next(false);
    console.log('AuthService: Déconnexion');
    this.router.navigate(['/admin/login']);
  }

  isAuthenticated(): boolean {
    return this.loggedIn.value;
  }
}
