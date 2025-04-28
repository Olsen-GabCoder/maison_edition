// src/app/admin/components/book-form/book-form.component.ts
import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Book } from '../../../models/book.model'; // Notre interface Book

@Component({
  selector: 'app-book-form', // Sélecteur pour utiliser ce composant
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule // Indispensable pour les formulaires réactifs
  ],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.scss']
})
export class BookFormComponent implements OnInit {

  private fb = inject(FormBuilder);

  // --- Inputs & Outputs pour la communication avec le composant parent ---

  // @Input() permet au composant parent de passer des données à ce composant.
  // On l'utilisera plus tard pour pré-remplir le formulaire en mode édition.
  @Input() initialData?: Book | null = null; // Données initiales (pour l'édition)
  @Input() isEditMode: boolean = false; // Indique si on est en mode ajout ou édition

  // @Output() permet à ce composant d'émettre des événements vers le parent.
  // On émettra les données du formulaire quand il sera soumis et valide.
  @Output() formSubmit = new EventEmitter<Omit<Book, 'id'>>(); // Émet les données du livre (sans ID pour l'ajout)
  // On pourrait avoir un EventEmitter<Book> pour l'édition incluant l'ID.

  // @Output() pour annuler (revenir à la liste par exemple)
  @Output() cancel = new EventEmitter<void>();

  // --- Logique du Formulaire ---
  bookForm!: FormGroup; // Le formulaire réactif
  isSubmitted = false; // Pour l'affichage des erreurs de validation

  ngOnInit(): void {
    this.initForm(); // Initialiser le formulaire au démarrage

    // Si on est en mode édition et qu'on a des données initiales, pré-remplir le formulaire
    if (this.isEditMode && this.initialData) {
      console.log('[BookForm] Mode Édition, patchValue avec:', this.initialData);
      // patchValue est plus sûr que setValue car il n'exige pas que toutes les clés soient présentes
      this.bookForm.patchValue(this.initialData);
    } else {
       console.log('[BookForm] Mode Ajout.');
    }
  }

  /** Initialise la structure du formulaire réactif */
  private initForm(): void {
    this.bookForm = this.fb.group({
      // Les contrôles correspondent aux champs du livre (sauf l'ID qui est géré ailleurs)
      title: ['', Validators.required],
      author: ['', Validators.required],
      coverUrl: ['', Validators.required], // Pour l'instant, juste l'URL
      summary: ['', [Validators.required, Validators.minLength(20)]],
      price: [null, [Validators.required, Validators.min(0.01)]], // Prix doit être positif
      category: ['', Validators.required]
      // On pourrait ajouter les mots-clés ici si nécessaire
    });
  }

  // Getter pour l'accès aux contrôles dans le template
  get formControls() {
    return this.bookForm.controls;
  }

  /** Gère la soumission du formulaire */
  onSubmit(): void {
    this.isSubmitted = true; // Marquer comme soumis

    if (this.bookForm.invalid) {
      console.warn('[BookForm] Tentative de soumission avec formulaire invalide.');
      // Marquer tous les champs comme "touchés" pour afficher les erreurs partout si besoin
      this.bookForm.markAllAsTouched();
      return; // Arrêter si invalide
    }

    // Le formulaire est valide, on émet les données
    console.log('[BookForm] Formulaire valide, émission via formSubmit:', this.bookForm.value);
    // On émet les données du formulaire (qui correspondent à Omit<Book, 'id'>)
    this.formSubmit.emit(this.bookForm.value);

    // On pourrait réinitialiser le formulaire ici si c'est pour l'ajout,
    // mais c'est souvent le composant parent qui gère la redirection après succès.
    // if (!this.isEditMode) { this.bookForm.reset(); this.isSubmitted = false; }
  }

  /** Gère l'annulation */
  onCancel(): void {
    console.log('[BookForm] Annulation demandée.');
    this.cancel.emit(); // Émettre l'événement d'annulation vers le parent
  }
}