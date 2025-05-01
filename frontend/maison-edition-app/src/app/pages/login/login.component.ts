// src/app/pages/login/login.component.ts - CORRIGÉ IMPORT UserProfile
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
// --- Imports Corrigés ---
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../models/user.model'; // <<<=== Importer depuis le bon fichier
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
    // console.log('[LoginComponent] URL de retour cible:', this.returnUrl); // Log optionnel
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
        // console.log('[LoginComponent] Connexion réussie, profil reçu:', userProfile); // Log optionnel

        // Logique de Redirection
        if (this.returnUrl && this.returnUrl !== '/') {
           // console.log(`[LoginComponent] Redirection vers returnUrl: ${this.returnUrl}`); // Log optionnel
           this.router.navigateByUrl(this.returnUrl);
        }
        else if (userProfile.role === 'admin') {
          // console.log('[LoginComponent] Redirection vers /admin'); // Log optionnel
          this.router.navigate(['/admin']);
        } else {
          // console.log('[LoginComponent] Redirection vers /'); // Log optionnel
          this.router.navigate(['/']);
        }

      },
      error: (err: Error | any) => {
        this.isLoading = false;
        this.errorMessage = err?.message || 'Une erreur est survenue lors de la connexion.';
        console.error('Erreur connexion:', err);
        // if (this.errorMessage) { // Affichage notification commenté
        //   this.notificationService.showError(this.errorMessage);
        // }
      }
    });
  }
}