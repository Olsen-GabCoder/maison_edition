// src/app/admin/pages/book-edit/book-edit.component.ts
import { Component, OnInit, inject } from '@angular/core';
// ... autres imports
import { NotificationService } from '../../../core/services/notification.service'; // <-- IMPORTER
import { Book } from '../../../models/book.model';
import { Observable, of, switchMap, tap, catchError, map } from 'rxjs';
import { BookService } from '../../../core/services/book.service';
import { ActivatedRoute, Router } from '@angular/router'; // Garder ActivatedRoute et Router
import { CommonModule } from '@angular/common';
import { BookFormComponent } from '../../components/book-form/book-form.component';


@Component({
  // ... selector, standalone, etc.
  standalone: true,
  imports: [CommonModule, BookFormComponent], // Supprimer RouterLink
  templateUrl: './book-edit.component.html',
  styleUrls: ['./book-edit.component.scss']
})
export class BookEditComponent implements OnInit {
  // ... injections (route, router, bookService)
  private notificationService = inject(NotificationService); // <-- INJECTER
  private route = inject(ActivatedRoute); // Pour lire les paramètres de l'URL
  private router = inject(Router);
  private bookService = inject(BookService);

  // ... propriétés (bookToEdit$, pageTitle, isLoading, isSubmitting, currentBookId)
  bookToEdit$: Observable<Book | null> | undefined;
  pageTitle = "Chargement...";
  isLoading = false;
  isSubmitting = false;
  currentBookId: number | null = null;
  errorMessage: string | null = null; // Garder pour erreurs de chargement/formulaire

  ngOnInit(): void {
    this.loadBook();
  }

  loadBook(): void {
    this.isLoading = true;
    this.errorMessage = null; // Réinitialiser pour le chargement
    this.pageTitle = 'Chargement...';
    this.bookToEdit$ = this.route.paramMap.pipe(
      switchMap(params => {
        const idParam = params.get('id');
        if (idParam) {
          const id = +idParam;
          this.currentBookId = id;
          return this.bookService.getBookById(id).pipe(
            map(book => book ? book : null), // S'assurer d'émettre null si book est undefined
            tap(book => {
              this.isLoading = false;
              if (!book) {
                const msg = `Livre ID ${id} non trouvé.`;
                this.errorMessage = msg; // Erreur affichée sur la page
                this.pageTitle = "Erreur";
              } else {
                this.pageTitle = `Modifier : ${book.title}`;
              }
            }),
            catchError(error => {
              this.isLoading = false;
              const msg = `Erreur chargement livre ID ${id}: ${error.message || 'Erreur serveur'}`;
              this.errorMessage = msg; // Erreur affichée sur la page
              this.pageTitle = "Erreur Chargement";
              this.notificationService.showError("Impossible de charger les données du livre."); // Notification générique
              console.error(msg, error);
              return of(null);
            })
          );
        } else {
          this.isLoading = false;
          this.errorMessage = 'ID de livre manquant.';
          this.pageTitle = "Erreur";
          return of(null);
        }
      })
    );
  }


  handleBookUpdate(bookData: Partial<Book>): void {
    if (this.currentBookId === null) return; // Sécurité
    this.isSubmitting = true;
    this.errorMessage = null; // Réinitialiser pour la soumission
    this.pageTitle = `Mise à jour...`;

    const updatedBook: Book = { ...bookData, id: this.currentBookId } as Book; // Créer un objet Book complet

    this.bookService.updateBook(updatedBook).subscribe({ // Passer l'objet Book complet
      next: (updatedBook) => {
        this.isSubmitting = false;
        console.log('[BookEdit] Mise à jour réussie:', updatedBook);
        const title = updatedBook?.title || 'Livre';
        this.notificationService.showSuccess(`"${title}" mis à jour avec succès !`); // <-- NOTIFICATION SUCCÈS
        this.router.navigate(['/admin/books']);
      },
      error: (err) => {
        this.isSubmitting = false;
        const message = `Échec mise à jour: ${err.message || 'Erreur inconnue'}`;
        console.error('[BookEdit] Erreur mise à jour:', err);
        this.notificationService.showError(message); // <-- NOTIFICATION ERREUR
        this.errorMessage = message; // Afficher aussi dans le formulaire via @Input generalError
        // Rétablir le titre
        this.bookToEdit$?.pipe(
          map(book => book ? `Modifier : ${book.title}` : 'Erreur de mise à jour')
        ).subscribe(title => this.pageTitle = title);
      }
    });
  }

  handleCancel(): void {
    this.router.navigate(['/admin/books']);
  }
}