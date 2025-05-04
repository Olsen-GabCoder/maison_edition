// src/app/pages/login/login.component.ts (Redirection Admin Prioritaire)
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../models/user.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  private returnUrl: string = '/';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    console.log('[LoginComponent] Initialisé. URL de retour cible:', this.returnUrl);

    // Redirection si déjà connecté (logique existante OK)
    if (this.authService.isLoggedIn()) {
      console.log('[LoginComponent] Utilisateur déjà connecté, redirection...');
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        // Pour un user déjà connecté, le profil est la destination logique
        this.router.navigate(['/profile']);
      }
    }
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (userProfile: UserProfile) => {
        this.isLoading = false;
        this.notificationService.showSuccess('Connexion réussie !');
        console.log('[LoginComponent] Connexion réussie, profil reçu:', userProfile);

        // === Logique de Redirection (MISE À JOUR - Priorité Admin) ===

        // 1. CAS PRIORITAIRE : Si l'utilisateur est ADMIN, toujours rediriger vers /admin
        if (userProfile.role === 'admin') {
          console.log('[LoginComponent] Redirection Admin vers /admin (prioritaire)');
          this.router.navigate(['/admin']);
        }
        // 2. SINON (utilisateur non-admin) : Gérer returnUrl ou rediriger vers /profile
        else {
          // Vérifier si une URL de retour valide est demandée
          const nonRedirectingUrls = ['/login', '/register', '/admin']; // Ajouter /admin aux URL à ignorer pour returnUrl
          if (this.returnUrl && this.returnUrl !== '/' && !nonRedirectingUrls.includes(this.returnUrl)) {
            console.log(`[LoginComponent] Redirection User vers returnUrl: ${this.returnUrl}`);
            this.router.navigateByUrl(this.returnUrl);
          } else {
            // Redirection par défaut pour les utilisateurs non-admin
            console.log('[LoginComponent] Redirection User vers /profile (défaut)');
            this.router.navigate(['/profile']);
          }
        }
        // === Fin Logique de Redirection ===

      },
      error: (err: Error | any) => {
        this.isLoading = false;
        this.errorMessage = err?.message || 'Une erreur est survenue lors de la connexion.';
        console.error('[LoginComponent] Erreur connexion:', err);
        if (this.errorMessage) {
          this.notificationService.showError(this.errorMessage);
        }
      }
    });
  }
}