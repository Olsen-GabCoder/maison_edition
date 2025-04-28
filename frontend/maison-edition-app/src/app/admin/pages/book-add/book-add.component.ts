// src/app/admin/pages/book-add/book-add.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookFormComponent } from '../../components/book-form/book-form.component';
import { BookService } from '../../../core/services/book.service';
import { Book } from '../../../models/book.model';

@Component({
  selector: 'app-book-add',
  standalone: true,
  imports: [ CommonModule, BookFormComponent ],
  templateUrl: './book-add.component.html',
  styleUrls: ['./book-add.component.scss']
})
export class BookAddComponent {

  private bookService = inject(BookService);
  private router = inject(Router);

  pageTitle = "Ajouter un Nouveau Livre";

  handleBookAdd(bookData: Omit<Book, 'id'>): void {
    console.log('[BookAddComponent] Réception des données du formulaire:', bookData);

    // >>> APPEL RÉEL AU SERVICE <<<
    this.bookService.addBook(bookData).subscribe({
      next: (newBook) => {
        console.log('[BookAddComponent] Livre ajouté avec succès via le service:', newBook);
        alert(`Le livre "${newBook.title}" (ID: ${newBook.id}) a été ajouté.`);
        // Rediriger vers la liste des livres après succès
        this.router.navigate(['/admin/books']);
      },
      error: (err) => {
        console.error('[BookAddComponent] Erreur lors de l\'ajout du livre:', err);
        alert('Une erreur est survenue lors de l\'ajout du livre.');
        // Rester sur le formulaire en cas d'erreur
      }
    });

    // --- La simulation est maintenant supprimée ---
    // alert(`Simulation : Ajout du livre "${bookData.title}" demandé...`);
    // this.router.navigate(['/admin/books']);
  }

  handleCancel(): void {
    console.log('[BookAddComponent] Annulation, retour à la liste des livres.');
    this.router.navigate(['/admin/books']);
  }
}