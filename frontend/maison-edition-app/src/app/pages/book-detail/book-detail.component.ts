// src/app/pages/book-detail/book-detail.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Book } from '../../models/book.model';
import { BookService } from '../../core/services/book.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookDetailComponent implements OnInit, OnDestroy {

  // Inject services
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookService = inject(BookService);
  private readonly notificationService = inject(NotificationService);

  // Reactive state
  private readonly destroy$ = new Subject<void>();
  private readonly bookSubject = new BehaviorSubject<Book | null | undefined>(undefined);
  readonly book$: Observable<Book | null | undefined> = this.bookSubject.asObservable();

  // UI flags
  isLoading = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadBookDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBookDetails(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.isLoading = true;
          this.errorMessage = null;
          this.bookSubject.next(undefined);
        }),
        switchMap(params => {
          const idParam = params.get('id');
          if (!idParam) {
            this.handleLoadingError(`ID du livre manquant dans l'URL.`);
            return of(null);
          }

          const id = Number(idParam);
          if (isNaN(id)) {
            this.handleLoadingError(`ID du livre invalide : ${idParam}`);
            return of(null);
          }

          return this.bookService.getBookById(id).pipe(
            takeUntil(this.destroy$),
            catchError(err => {
              console.error('[BookDetail] Erreur getBookById :', err);
              this.handleLoadingError('Erreur lors du chargement du livre.');
              return of(null);
            })
          );
        })
      )
      .subscribe(book => {
        this.isLoading = false;

        if (!book) {
          this.handleLoadingError('Livre introuvable.', false);
          this.bookSubject.next(null);
        } else {
          this.bookSubject.next(book);
        }
      });
  }

  private handleLoadingError(message: string, notify = true): void {
    this.errorMessage = message;
    this.isLoading = false;
    if (notify) {
      this.notificationService.showError(message);
    }
  }

  // 🔙 Retour vers la liste
  goBack(): void {
    this.router.navigate(['/']);
  }

  // 🛒 Achat
  buyBook(bookId: number | undefined): void {
    if (!bookId) return;
    console.log(`[BookDetail] Achat ID: ${bookId}`);
    this.router.navigate(['/order/new', bookId]);
  }

  // ❤️ Ajout aux favoris
  addToLibrary(bookId: number | undefined): void {
    if (!bookId) return;
    console.log(`[BookDetail] Ajouter aux favoris ID: ${bookId}`);
    this.notificationService.showInfo(`Le livre a été ajouté à votre bibliothèque.`);
  }
}
