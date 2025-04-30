// src/app/admin/components/book-form/book-form.component.ts
import { Component, OnInit, OnChanges, Input, Output, EventEmitter, inject, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
// --- Imports nécessaires pour Reactive Forms ---
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
// --- Fin Imports Reactive Forms ---
import { Book } from '../../../models/book.model'; // Gardez l'import du modèle

// Optionnel: Un validateur de pattern URL simple mais courant
export const urlValidator: ValidatorFn = (control: AbstractControl): { [key: string]: any } | null => {
  if (!control.value) {
    return null; // Ne pas valider si le champ est vide (le rendre optionnel)
  }
  // Regex simple pour vérifier si ça ressemble à une URL (commence par http/https, contient au moins un . etc.)
  // Vous pouvez utiliser une regex plus complexe si nécessaire.
  const pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
  return pattern.test(control.value) ? null : { 'pattern': { value: control.value } };
};

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.scss']
})
export class BookFormComponent implements OnInit, OnChanges {

  private fb = inject(FormBuilder);

  @Input() initialData: Partial<Book> | null | undefined = null;
  @Input() isSubmitting: boolean = false;
  @Input() generalError: string | null = null;
  @Output() formSubmit = new EventEmitter<Partial<Book>>();
  @Output() cancel = new EventEmitter<void>();
  @Input() isEditMode: boolean = false;

  bookForm: FormGroup = this.fb.group({});

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && this.bookForm && this.initialData) {
      console.log('[BookForm] ngOnChanges: Patching form with initialData:', this.initialData);
      this.bookForm.patchValue(this.initialData);
    }
    if (changes['generalError']) {
      console.log('[BookForm] Received general error:', this.generalError);
    }
    if (changes['isSubmitting']) {
      if (this.isSubmitting) { this.bookForm.disable(); } else { this.bookForm.enable(); }
    }
    if (changes['isEditMode']) {
      this.isEditMode = changes['isEditMode'].currentValue;
      console.log('[BookForm] Mode édition (via ngOnChanges):', this.isEditMode);
    }
  }

  private initializeForm(): void {
    this.bookForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      coverUrl: ['', [urlValidator, Validators.maxLength(2048)]],
      summary: ['', [Validators.maxLength(2000)]],
      price: [null, [Validators.required, Validators.min(0.01)]],
      category: ['', [Validators.maxLength(50)]]
    });
    if (this.initialData) {
      this.bookForm.patchValue(this.initialData);
    }
  }

  onSubmit(): void {
    // console.log('[BookForm] onSubmit DÉCLENCHÉ. Valeur actuelle du formulaire:', this.bookForm.value); // <-- Ligne supprimée/commentée
    this.bookForm.markAllAsTouched();
    if (this.bookForm.valid) {
      // Gardons ce log, il peut être utile de voir ce qui est réellement soumis
      console.log('[BookForm] Formulaire valide. Données soumises:', this.bookForm.value);
      this.formSubmit.emit(this.bookForm.value);
    } else {
      console.warn('[BookForm] Tentative de soumission d\'un formulaire invalide.');
      this.scrollToFirstInvalidControl();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getControl(name: keyof Book | string): AbstractControl | null {
    return this.bookForm.get(name as string);
  }

  isInvalid(name: keyof Book | string): boolean {
    const control = this.getControl(name);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  getErrorMessage(name: keyof Book | string): string | null {
    const control = this.getControl(name);
    if (!control || !control.errors || !(control.touched || control.dirty)) { return null; }
    if (control.errors['required']) { return 'Ce champ est obligatoire.'; }
    if (control.errors['minlength']) { return `Doit contenir au moins ${control.errors['minlength'].requiredLength} caractères.`; }
    if (control.errors['maxlength']) { return `Ne doit pas dépasser ${control.errors['maxlength'].requiredLength} caractères.`; }
    if (control.errors['min']) { return `La valeur minimale est ${control.errors['min'].min}.`; }
    if (control.errors['pattern']) {
      if (name === 'coverUrl') return 'Veuillez entrer une URL valide (ex: http://...).';
      return 'Format invalide.';
    }
    return 'Valeur invalide.';
  }

  private scrollToFirstInvalidControl(): void {
    const firstInvalidControl = document.querySelector('form .ng-invalid');
    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof (firstInvalidControl as HTMLElement).focus === 'function') {
        (firstInvalidControl as HTMLElement).focus();
      }
    }
  }

  // La méthode objectKeys n'est plus nécessaire car le debug HTML a été retiré
  /*
  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }
  */
}