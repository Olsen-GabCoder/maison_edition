// src/app/pages/contact/contact.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router'; // <--- Importer Router
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {

  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private router = inject(Router); // <--- Injecter Router

  contactForm!: FormGroup;
  isSubmitted = false;
  submitMessage: string | null = null;
  submitMessageType: 'success' | 'error' | null = null;
  isSubmitting = false; // Pour désactiver le bouton pendant l'envoi

  // Pas besoin de constructor explicite si on utilise inject()

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      // subject: ['', Validators.required], // <--- SUPPRIMER LA VALIDATION DU SUJET
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  // Getter pratique pour accéder aux contrôles dans le template
  get formControls() {
    return this.contactForm.controls;
  }

  onSubmit(): void {
    this.isSubmitted = true;
    this.submitMessage = null;
    this.submitMessageType = null;

    if (this.contactForm.invalid) {
      console.warn('[ContactComponent] Tentative de soumission avec formulaire invalide.');
      this.contactForm.markAllAsTouched(); // Afficher les erreurs sur tous les champs
      return;
    }

    if (this.isSubmitting) {
       return; // Empêcher double soumission
    }
    this.isSubmitting = true; // Désactiver bouton

    const formValue = this.contactForm.value;

    // Vérifier que les valeurs nécessaires sont présentes (même si le formulaire est valide)
    if (formValue.name && formValue.email && formValue.message) {
      try {
        // Appeler le service pour ajouter le message
        // Passer une valeur par défaut ou vide pour le sujet car le service l'attend
        this.contactService.addMessage(
          formValue.name,
          formValue.email,
          'Contact depuis le site', // <--- Sujet par défaut
          formValue.message
        );

        console.log('[ContactComponent] Appel à contactService.addMessage réussi.');
        this.submitMessage = 'Votre message a été envoyé avec succès ! Vous allez être redirigé.';
        this.submitMessageType = 'success';

        // Réinitialiser le formulaire après un court délai pour que l'utilisateur voie le message
        setTimeout(() => {
          this.contactForm.reset();
          this.isSubmitted = false;
          // Optionnel: réinitialiser l'état des contrôles (peut ne pas être nécessaire après reset)
          Object.keys(this.formControls).forEach(key => {
            this.formControls[key].setErrors(null);
            this.formControls[key].markAsUntouched();
            this.formControls[key].markAsPristine();
          });
          this.isSubmitting = false; // Réactiver bouton

          // ---> REDIRECTION VERS LA PAGE D'ACCUEIL <---
          this.router.navigate(['/']);
          console.log('[ContactComponent] Redirection vers /');

        }, 2500); // Délai de 2.5 secondes avant reset et redirection

      } catch (error) {
        // Ce catch est limité car addMessage est synchrone dans le service actuel
        console.error('[ContactComponent] Erreur (catch) lors de l\'appel à contactService.addMessage:', error);
        this.submitMessage = 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer.';
        this.submitMessageType = 'error';
        this.isSubmitting = false; // Réactiver bouton en cas d'erreur
      }
    } else {
      // Ne devrait pas arriver si la validation est correcte, mais sécurité
      console.error('[ContactComponent] Données du formulaire manquantes après validation !');
      this.submitMessage = 'Erreur interne du formulaire.';
      this.submitMessageType = 'error';
      this.isSubmitting = false; // Réactiver bouton
    }
  }
}