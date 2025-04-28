import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  contactForm!: FormGroup;
  isSubmitted = false;
  submitMessage: string | null = null;
  submitMessageType: 'success' | 'error' | null = null;

  constructor() { }

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  get formControls() {
    return this.contactForm.controls;
  }

  onSubmit(): void {
    this.isSubmitted = true;
    this.submitMessage = null;
    this.submitMessageType = null;

    if (this.contactForm.invalid) {
      console.log('Formulaire invalide');
      this.contactForm.markAllAsTouched();
      return;
    }

    const formValue = this.contactForm.value;

    if (formValue.name && formValue.email && formValue.subject && formValue.message) {
      try {
        this.contactService.addMessage(
          formValue.name,
          formValue.email,
          formValue.subject,
          formValue.message
        );
        console.log('Message ajouté avec succès via ContactService.');
        this.submitMessage = 'Votre message a été envoyé avec succès !';
        this.submitMessageType = 'success';
        this.contactForm.reset();
        this.isSubmitted = false;
        Object.keys(this.formControls).forEach(key => {
          this.formControls[key].setErrors(null);
          this.formControls[key].markAsUntouched();
          this.formControls[key].markAsPristine();
        });
      } catch (error) {
        console.error('Erreur lors de l\'appel à contactService.addMessage:', error);
        this.submitMessage = 'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer.';
        this.submitMessageType = 'error';
      }
    } else {
      console.error('Données du formulaire manquantes malgré la validation.');
      this.submitMessage = 'Erreur interne du formulaire. Veuillez recharger la page.';
      this.submitMessageType = 'error';
    }
  }
}
