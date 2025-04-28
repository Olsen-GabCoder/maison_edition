// src/app/admin/components/book-form/book-form.component.ts
import { Component, OnInit, OnChanges, Input, Output, EventEmitter, inject, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
// --- Imports nécessaires pour Reactive Forms ---
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
// --- Fin Imports Reactive Forms ---
import { Book } from '../../../models/book.model';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule // Nécessaire pour [formGroup], formControlName, etc.
  ],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.scss']
})
export class BookFormComponent implements OnInit, OnChanges {

  // Injection du FormBuilder
  private fb = inject(FormBuilder);

  // Inputs & Outputs (inchangés)
  @Input() initialData: any | null | undefined = null; // Type any pour éviter les erreurs strictes
  @Input() isSubmitting: boolean = false;
  @Input() generalError: string | null = null; // Pour afficher une erreur venant du parent (ex: API)
  @Output() formSubmit = new EventEmitter<Partial<any>>(); // Type Partial<any> pour la sortie
  @Output() cancel = new EventEmitter<void>();
  @Input() isEditMode: boolean = false; // Ajout de l'input manquant

  // --- Déclaration du FormGroup ---
  bookForm: FormGroup = this.fb.group({}); // Initialisation vide, remplie dans ngOnInit
  // --- Fin Déclaration FormGroup ---

  ngOnInit(): void {
    this.initializeForm(); // Initialiser le formulaire à la création
  }

  // Détecter les changements sur initialData (pour le mode édition)
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && this.bookForm && this.initialData) {
      console.log('[BookForm] ngOnChanges: Patching form with initialData:', this.initialData);
      // Utiliser patchValue pour ne mettre à jour que les champs fournis
      this.bookForm.patchValue({
        ...this.initialData,
        // Conversion spécifique si nécessaire (ex: Date)
        publishedDate: this.formatDateForInput(this.initialData.publishedDate)
      });
    }
    if (changes['generalError']) {
      // On pourrait vouloir afficher l'erreur générale d'une manière spécifique ici
      console.log('[BookForm] Received general error:', this.generalError);
    }
    if (changes['isSubmitting']) {
      if (this.isSubmitting) {
        this.bookForm.disable(); // Désactiver le formulaire pendant la soumission
      } else {
        this.bookForm.enable(); // Réactiver après
      }
    }
    if (changes['isEditMode']) {
      this.isEditMode = changes['isEditMode'].currentValue;
      console.log('[BookForm] Mode édition (via ngOnChanges):', this.isEditMode);
    }
  }

  /**
   * Initialise le FormGroup avec les FormControls et les validateurs.
   */
  private initializeForm(): void {
    this.bookForm = this.fb.group({
      // --- Définition des contrôles avec validateurs ---
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      isbn: ['', [Validators.pattern(/^\d{10}(\d{3})?$/)]], // Valide ISBN-10 ou ISBN-13 (simplifié)
      description: ['', Validators.maxLength(1000)],
      publishedDate: [''], // Pas de validateur requis pour l'instant, mais pourrait être ajouté
      price: [null, [Validators.required, Validators.min(0.01)]], // Prix obligatoire et positif
      category: ['', Validators.maxLength(50)],
      stock: [null, [Validators.min(0)]], // Stock optionnel, mais >= 0 si fourni
      summary: [''], // Suppression du validateur required pour summary
      coverUrl: [''], // Ajout du champ coverUrl au formulaire
      // Pas besoin de id, createdAt, updatedAt dans le formulaire
    });

    // Si des données initiales existent déjà au moment de l'init (moins courant mais possible)
    if (this.initialData) {
      this.bookForm.patchValue({
        ...this.initialData,
        publishedDate: this.formatDateForInput(this.initialData.publishedDate)
      });
    }
  }

  /**
   * Gère la soumission du formulaire.
   * Vérifie la validité avant d'émettre l'événement.
   */
  onSubmit(): void {
    // Marquer tous les champs comme 'touched' pour afficher les erreurs restantes
    this.bookForm.markAllAsTouched();

    if (this.bookForm.valid) {
      console.log('[BookForm] Formulaire valide. Données soumises:', this.bookForm.value);
      // Émettre uniquement les données du formulaire (qui sont un Partial<any>)
      this.formSubmit.emit(this.bookForm.value);
    } else {
      console.warn('[BookForm] Tentative de soumission d\'un formulaire invalide.');
      // Optionnel : Scroller vers le premier champ invalide ou afficher un message global
      this.scrollToFirstInvalidControl();
    }
  }

  /** Émet l'événement d'annulation */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Méthode utilitaire pour obtenir une référence facile à un contrôle du formulaire.
   * Utilisé dans le template pour vérifier l'état d'un contrôle.
   * Exemple: `isInvalid('title')`
   */
  getControl(name: string): AbstractControl | null {
    return this.bookForm.get(name);
  }

  /**
   * Vérifie si un contrôle est invalide ET a été touché ou si le formulaire a été soumis.
   * @param name Nom du FormControl
   * @returns boolean
   */
  isInvalid(name: string): boolean {
    const control = this.getControl(name);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  /**
   * Obtient le message d'erreur spécifique pour un contrôle donné.
   * @param name Nom du FormControl
   * @returns string | null Message d'erreur ou null
   */
  getErrorMessage(name: string): string | null {
    const control = this.getControl(name);
    if (!control || !control.errors || !(control.touched || control.dirty)) {
      return null;
    }

    if (control.errors['required']) {
      return 'Ce champ est obligatoire.';
    }
    if (control.errors['minlength']) {
      return `Doit contenir au moins ${control.errors['minlength'].requiredLength} caractères.`;
    }
    if (control.errors['maxlength']) {
      return `Ne doit pas dépasser ${control.errors['maxlength'].requiredLength} caractères.`;
    }
    if (control.errors['min']) {
      return `La valeur minimale est ${control.errors['min'].min}.`;
    }
    if (control.errors['pattern']) {
      if (name === 'isbn') return 'Format ISBN invalide (10 ou 13 chiffres).';
      return 'Format invalide.';
    }
    // Ajoutez d'autres messages d'erreur personnalisés si nécessaire
    return 'Valeur invalide.';
  }

  /** Formate une date (ou undefined) en chaîne<ctrl3348>-MM-DD pour l'input date */
  private formatDateForInput(date: any): string | null { // Type any pour la compatibilité
    if (!date) return null;
    try {
      const d = new Date(date);
      // Vérifier si la date est valide après conversion
      if (isNaN(d.getTime())) return null;
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Erreur formatage date:", e);
      return null; // Retourner null si le formatage échoue
    }
  }

  /** Fait défiler la vue vers le premier contrôle invalide trouvé */
  private scrollToFirstInvalidControl(): void {
    const firstInvalidControl = document.querySelector('form .ng-invalid');
    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Essayer de donner le focus si c'est un élément focusable
      if (typeof (firstInvalidControl as HTMLElement).focus === 'function') {
        (firstInvalidControl as HTMLElement).focus();
      }
    }
  }
}