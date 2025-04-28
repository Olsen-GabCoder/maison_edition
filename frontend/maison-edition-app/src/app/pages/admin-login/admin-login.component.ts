import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent implements OnInit {

  loginForm!: FormGroup;
  isSubmitted = false;
  loginError: string | null = null;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get formControls() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.isSubmitted = true;
    this.loginError = null;

    if (this.loginForm.invalid) {
      console.log('Tentative de soumission avec formulaire invalide.');
      return;
    }

    console.log('Tentative de connexion avec:', this.loginForm.value.email);
    this.authService.login(this.loginForm.value)
      .subscribe({
        next: (loginSuccess) => {
          if (loginSuccess) {
            console.log('Connexion réussie, redirection vers /admin');
            this.router.navigate(['/admin']);
          } else {
            console.log('Échec de la connexion (identifiants incorrects).');
            this.loginError = 'L\'adresse e-mail ou le mot de passe fourni est incorrect.';
          }
        },
        error: (err) => {
          console.error('Erreur inattendue pendant le login:', err);
          this.loginError = 'Une erreur serveur est survenue, veuillez réessayer.';
        }
      });
  }
}
