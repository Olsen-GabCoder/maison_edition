// src/app/pages/book-detail/book-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap, catchError, tap } from 'rxjs';
import { Book } from '../../models/book.model'; // <-- Utilise le modèle fourni
import { BookService } from '../../core/services/book.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.scss'] // Utilise le SCSS corrigé
})
export class BookDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  private notificationService = inject(NotificationService);

  book$: Observable<Book | null | undefined> = of(null);
  isLoading: boolean = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadBookDetails();
  }

  loadBookDetails(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.book$ = this.route.paramMap.pipe(
      switchMap(params => {
        const idParam = params.get('id');
        if (!idParam) {
          this.errorMessage = 'ID du livre manquant dans l\'URL.';
          this.isLoading = false;
          this.handleLoadingError(this.errorMessage);
          return of(null);
        }
        const id = +idParam;
        if (isNaN(id)) {
          this.errorMessage = 'ID du livre invalide.';
          this.isLoading = false;
           this.handleLoadingError(this.errorMessage);
          return of(null);
        }

        console.log(`[BookDetail] Chargement du livre ID: ${id}`);
        return this.bookService.getBookById(id).pipe(
          tap(book => {
            this.isLoading = false;
            if (!book) {
              this.errorMessage = `Livre avec l'ID ${id} non trouvé.`;
              console.warn(`[BookDetail] Livre non trouvé pour ID: ${id}`);
               this.handleLoadingError(this.errorMessage, false);
            } else {
              console.log(`[BookDetail] Livre trouvé:`, book);
              // Les propriétés utilisées dans le template sont maintenant
              // title, author, coverUrl, summary, price, category, id
              // qui sont toutes dans le modèle fourni.
            }
          }),
          catchError(error => {
            this.isLoading = false;
            this.errorMessage = 'Une erreur est survenue lors du chargement du livre.';
            console.error('[BookDetail] Erreur chargement:', error);
             this.handleLoadingError(this.errorMessage);
            return of(null);
          })
        );
      })
    );
  }

  private handleLoadingError(message: string, notify: boolean = true): void {
      this.errorMessage = message;
      if (notify) {
          this.notificationService.showError(message);
      }
  }

  goBack(): void {
    // Navigue vers la page d'accueil comme solution simple
    this.router.navigate(['/']);
  }
}