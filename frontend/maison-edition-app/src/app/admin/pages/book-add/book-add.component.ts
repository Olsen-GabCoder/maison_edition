// src/app/admin/pages/book-add/book-add.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookFormComponent } from '../../components/book-form/book-form.component';
import { BookService } from '../../../core/services/book.service';
import { Book } from '../../../models/book.model';
import { NotificationService } from '../../../core/services/notification.service'; // <-- IMPORTER

@Component({
  selector: 'app-book-add',
  standalone: true,
  imports: [CommonModule, BookFormComponent], // Supprimer RouterLink
  templateUrl: './book-add.component.html',
  styleUrls: ['./book-add.component.scss']
})
export class BookAddComponent {
  private bookService = inject(BookService);
  private router = inject(Router);
  private notificationService = inject(NotificationService); // <-- INJECTER

  isSubmitting = false;
  pageTitle = "Ajouter un Nouveau Livre"; // <-- AJOUTER CETTE LIGNE
  // errorMessage: string | null = null; // Peut être supprimé ou gardé pour erreurs spécifiques au formulaire

  handleBookAdd(bookData: Partial<Book>): void {
    this.isSubmitting = true;
    // this.errorMessage = null;

    this.bookService.addBook(bookData as Omit<Book, 'id'>).subscribe({
      next: (newBook) => {
        this.isSubmitting = false;
        console.log('[BookAdd] Livre ajouté avec succès:', newBook);
        this.notificationService.showSuccess(`Livre "${newBook.title}" ajouté avec succès !`); // <-- NOTIFICATION SUCCÈS
        this.router.navigate(['/admin/books']);
      },
      error: (err) => {
        this.isSubmitting = false;
        const message = `Erreur lors de l'ajout : ${err.message || 'Erreur inconnue'}`;
        console.error('[BookAdd] Erreur ajout livre:', err);
        this.notificationService.showError(message); // <-- NOTIFICATION ERREUR
        // this.errorMessage = message; // Garder si vous voulez afficher aussi dans le formulaire
      }
    });
  }

  handleCancel(): void {
    this.router.navigate(['/admin/books']);
  }
}