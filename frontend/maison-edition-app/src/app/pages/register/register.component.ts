// src/app/pages/register/register.component.ts - VERSION CORRIGÉE FINALE
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service'; // Utilise le service unifié
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService); // Injection du service unifié
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      // confirmPassword: ['', Validators.required] // Décommenter et ajouter au groupe si besoin
    }
    // Ajouter le validateur de groupe ici si confirmPassword est utilisé
    );
  }

  // Getters pour un accès facile dans le template (optionnel)
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  // get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  /**
   * Gère la soumission du formulaire d'inscription.
   */
  onSubmit(): void {
    this.errorMessage = null; // Réinitialiser l'erreur à chaque soumission
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched(); // Marquer tous les champs pour afficher les erreurs
      return; // Arrêter si le formulaire est invalide
    }

    this.isLoading = true; // Activer l'indicateur de chargement
    const credentials = {
      email: this.registerForm.value.email,
      password: this.registerForm.value.password // Le service simulé l'ignore, mais on l'envoie
    };

    // Appel de la méthode register du service AuthService
    this.authService.register(credentials).subscribe({
      /** Callback exécuté si l'observable complète (succès) */
      next: () => { // Pas d'argument 'success' car Observable<void>
        this.isLoading = false; // Désactiver le chargement
        this.notificationService.showSuccess('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        this.router.navigate(['/login']); // Rediriger vers la page de connexion
      },
      /** Callback exécuté si l'observable émet une erreur */
      error: (err: Error | any) => { // Typer l'erreur (any est plus flexible ici)
        this.isLoading = false; // Désactiver le chargement
        // Extraire le message d'erreur (venant de throwError dans le service)
        this.errorMessage = err?.message || 'Une erreur inconnue est survenue lors de l\'inscription.';

        // Vérifier si le message d'erreur (non null) contient des mots clés
        // pour marquer spécifiquement le champ email
        if (this.errorMessage && this.errorMessage.toLowerCase().includes('email') && this.errorMessage.toLowerCase().includes('utilis')) {
             this.email?.setErrors({'duplicate': true}); // Marquer comme dupliqué
        } else {
             // Marquer une erreur générique sur l'ensemble du formulaire
             this.registerForm.setErrors({'serverError': true });
        }

        console.error('Erreur inscription:', err); // Log pour le débogage
        // Afficher la notification d'erreur seulement si errorMessage a une valeur
        if(this.errorMessage) {
            this.notificationService.showError(this.errorMessage);
        }
      }
    });
  }
}