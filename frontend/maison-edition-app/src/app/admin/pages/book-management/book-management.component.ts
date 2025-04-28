// src/app/admin/pages/book-management/book-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // Router est déjà importé
import { Observable } from 'rxjs';
import { Book } from '../../../models/book.model';
import { BookService } from '../../../core/services/book.service';

@Component({
  selector: 'app-book-management',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './book-management.component.html',
  styleUrls: ['./book-management.component.scss']
})
export class BookManagementComponent implements OnInit {

  private bookService = inject(BookService);
  private router = inject(Router); // Router est déjà injecté

  books$: Observable<Book[]> = this.bookService.books$;

  ngOnInit(): void {
    console.log('[BookManagementComponent] ngOnInit: Initialisation.');
  }

  deleteBook(bookId: number, bookTitle: string): void {
    // ... (code de suppression inchangé) ...
     if (confirm(`Êtes-vous sûr de vouloir supprimer le livre "${bookTitle}" (ID: ${bookId}) ?`)) {
      this.bookService.deleteBook(bookId).subscribe({
        next: (success) => {
          if (success) { alert(`Le livre "${bookTitle}" a été supprimé.`); }
          else { alert(`Erreur: Impossible de trouver le livre avec l'ID ${bookId} pour le supprimer.`); }
        },
        error: (err) => { alert('Une erreur technique est survenue pendant la suppression.'); }
      });
    }
  }

  /** Navigue vers la page d'édition du livre spécifié */
  editBook(bookId: number): void {
    console.log(`[BookManagementComponent] Clic sur Modifier pour ID: ${bookId}, navigation vers /admin/books/edit/${bookId}`);
    // Utiliser le Router pour naviguer vers la route d'édition, en passant l'ID
    this.router.navigate(['/admin/books/edit', bookId]); // <<< Navigation implémentée
  }

   addBook(): void {
     console.log(`[BookManagementComponent] Clic sur Ajouter, navigation vers /admin/books/add`);
     this.router.navigate(['/admin/books/add']);
   }
}